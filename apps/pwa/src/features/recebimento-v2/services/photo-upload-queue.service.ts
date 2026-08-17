import { calculateNextAttemptAt, type RetryPolicy } from '@lilog/local-sync';

import { uppyBucketUpload } from '@/lib/uppy/uppy-bucket-upload';

import { debugRecebimentoV2 } from '../lib/sync-debug';
import { recebimentoV2Db } from '../local-db/db';
import type { ChecklistPhotoMediaIds, MediaRecord } from '../local-db/schema';
import {
  AVARIA_TARGET_ENTITY_TYPE,
  CHECKLIST_TARGET_ENTITY_TYPE,
  IMPEDIMENTO_TARGET_ENTITY_TYPE,
  collectChecklistPhotoIds,
  recoverStuckUploadingPhotos,
  resolveAndStampAllPhotoTargets,
} from './sync-photo.helpers';

const PHOTO_QUEUE_INTERVAL_MS = 30_000;
const PHOTO_QUEUE_DEBOUNCE_MS = 800;
const MAX_CONCURRENT_UPLOAD_GROUPS = 2;

const PHOTO_UPLOAD_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 5,
  initialDelayMs: 3_000,
  maxDelayMs: 120_000,
  backoffFactor: 2,
  jitter: 0.1,
};

const CHECKLIST_SLOT_UPLOAD_NAMES: Record<keyof ChecklistPhotoMediaIds, string> = {
  lacre: 'lacre',
  bauFechado: 'bau-fechado',
  bauAberto: 'bau-aberto',
  extras: 'extras',
};

export interface PhotoUploadQueueResult {
  uploaded: number;
  failed: number;
  skipped: number;
}

type UploadGroupKey = `${string}::${string}`;

type UploadGroup = {
  targetEntityId: string;
  targetEntityType: string;
  records: MediaRecord[];
};

const activeDemands = new Set<string>();
const scheduledQueueByDemand = new Map<string, ReturnType<typeof setTimeout>>();
const processingDemands = new Set<string>();
let listenersCleanup: (() => void) | null = null;

function isBrowserOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }

  return navigator.onLine !== false;
}

function buildUploadGroupKey(targetEntityId: string, targetEntityType: string): UploadGroupKey {
  return `${targetEntityType}::${targetEntityId}`;
}

function isMediaEligibleForUpload(media: MediaRecord, nowMs: number): boolean {
  if (media.status === 'uploaded' || media.status === 'uploading') {
    return false;
  }

  if (!media.targetEntityId || !media.targetEntityType) {
    return false;
  }

  if (!media.blob) {
    return false;
  }

  if (media.status === 'error') {
    const attempts = media.uploadAttempts ?? 0;
    if (attempts >= PHOTO_UPLOAD_RETRY_POLICY.maxAttempts) {
      return false;
    }

    if (media.nextUploadAttemptAt) {
      const nextAttemptMs = Date.parse(media.nextUploadAttemptAt);
      if (!Number.isNaN(nextAttemptMs) && nextAttemptMs > nowMs) {
        return false;
      }
    }
  }

  return media.status === 'local' || media.status === 'error';
}

function buildChecklistNomeByMediaId(
  photoMediaIds: ChecklistPhotoMediaIds | undefined,
): Map<string, string> {
  const nomeByMediaId = new Map<string, string>();
  if (!photoMediaIds) {
    return nomeByMediaId;
  }

  for (const [slotKey, slotUploadName] of Object.entries(
    CHECKLIST_SLOT_UPLOAD_NAMES,
  ) as Array<[keyof ChecklistPhotoMediaIds, string]>) {
    for (const mediaId of photoMediaIds[slotKey] ?? []) {
      nomeByMediaId.set(mediaId, `checklist-${slotUploadName}-${mediaId}.jpg`);
    }
  }

  return nomeByMediaId;
}

async function listEligibleMediaForUpload(demandId: string): Promise<MediaRecord[]> {
  const nowMs = Date.now();
  const mediaRecords = await recebimentoV2Db.media
    .where('processId')
    .equals(demandId)
    .toArray();

  const eligible = mediaRecords.filter((record) => isMediaEligibleForUpload(record, nowMs));

  for (const record of eligible) {
    if (record.status === 'error') {
      await recebimentoV2Db.media.update(record.id, {
        status: 'local',
        errorMessage: undefined,
        errorStep: undefined,
      });
    }
  }

  return eligible;
}

function groupMediaByTarget(records: MediaRecord[]): UploadGroup[] {
  const groups = new Map<UploadGroupKey, UploadGroup>();

  for (const record of records) {
    if (!record.targetEntityId || !record.targetEntityType) {
      continue;
    }

    const key = buildUploadGroupKey(record.targetEntityId, record.targetEntityType);
    const existing = groups.get(key);

    if (existing) {
      existing.records.push(record);
      continue;
    }

    groups.set(key, {
      targetEntityId: record.targetEntityId,
      targetEntityType: record.targetEntityType,
      records: [record],
    });
  }

  return [...groups.values()];
}

async function uploadGroup(
  demandId: string,
  group: UploadGroup,
): Promise<PhotoUploadQueueResult> {
  const process = await recebimentoV2Db.processes.get(demandId);
  const recebimentoId = process?.recebimentoId?.trim() || null;
  const entidadeId =
    group.targetEntityType === AVARIA_TARGET_ENTITY_TYPE && recebimentoId
      ? recebimentoId
      : group.targetEntityId;
  const checklist =
    group.targetEntityType === CHECKLIST_TARGET_ENTITY_TYPE
      ? await recebimentoV2Db.checklists.get(demandId)
      : undefined;
  const checklistNomeByMediaId = buildChecklistNomeByMediaId(checklist?.photoMediaIds);

  const result = await uppyBucketUpload(group.records, {
    entidadeTipo: group.targetEntityType,
    entidadeId,
    sessionLabel: `Upload ${group.targetEntityType} ${group.targetEntityId.slice(0, 8)}`,
    concurrency: 3,
    nome: (record) => {
      if (group.targetEntityType === CHECKLIST_TARGET_ENTITY_TYPE) {
        return checklistNomeByMediaId.get(record.id) ?? `checklist-${record.id}.jpg`;
      }

      if (group.targetEntityType === AVARIA_TARGET_ENTITY_TYPE) {
        return `avaria-${record.id}.jpg`;
      }

      if (group.targetEntityType === IMPEDIMENTO_TARGET_ENTITY_TYPE) {
        return `impedimento-${record.id}.jpg`;
      }

      return record.filename ?? `${record.id}.jpg`;
    },
  });

  const nowMs = Date.now();

  for (const record of group.records) {
    const updated = await recebimentoV2Db.media.get(record.id);
    if (!updated || updated.status !== 'error') {
      continue;
    }

    const nextAttempts = (updated.uploadAttempts ?? 0) + 1;
    await recebimentoV2Db.media.update(record.id, {
      uploadAttempts: nextAttempts,
      nextUploadAttemptAt: new Date(
        calculateNextAttemptAt(nextAttempts, PHOTO_UPLOAD_RETRY_POLICY),
      ).toISOString(),
    });
  }

  debugRecebimentoV2('photo-queue', 'group-complete', {
    demandId,
    targetEntityType: group.targetEntityType,
    targetEntityId: group.targetEntityId,
    uploadEntityId: entidadeId,
    mediaCount: group.records.length,
    ...result,
    nowMs,
  });

  return result;
}

function mergePhotoUploadResults(
  ...results: PhotoUploadQueueResult[]
): PhotoUploadQueueResult {
  return results.reduce(
    (aggregate, result) => ({
      uploaded: aggregate.uploaded + result.uploaded,
      failed: aggregate.failed + result.failed,
      skipped: aggregate.skipped + result.skipped,
    }),
    { uploaded: 0, failed: 0, skipped: 0 },
  );
}

async function processGroupsWithConcurrency(
  demandId: string,
  groups: UploadGroup[],
): Promise<PhotoUploadQueueResult> {
  const aggregate: PhotoUploadQueueResult = { uploaded: 0, failed: 0, skipped: 0 };

  for (let index = 0; index < groups.length; index += MAX_CONCURRENT_UPLOAD_GROUPS) {
    const batch = groups.slice(index, index + MAX_CONCURRENT_UPLOAD_GROUPS);
    const batchResults = await Promise.all(batch.map((group) => uploadGroup(demandId, group)));
    const merged = mergePhotoUploadResults(...batchResults);
    aggregate.uploaded += merged.uploaded;
    aggregate.failed += merged.failed;
    aggregate.skipped += merged.skipped;
  }

  return aggregate;
}

export async function processPhotoQueue(
  demandId: string,
): Promise<PhotoUploadQueueResult> {
  if (!isBrowserOnline()) {
    return { uploaded: 0, failed: 0, skipped: 0 };
  }

  if (processingDemands.has(demandId)) {
    return { uploaded: 0, failed: 0, skipped: 0 };
  }

  processingDemands.add(demandId);

  try {
    await recoverStuckUploadingPhotos(demandId);
    await resolveAndStampAllPhotoTargets(demandId);

    const eligible = await listEligibleMediaForUpload(demandId);
    if (eligible.length === 0) {
      return { uploaded: 0, failed: 0, skipped: 0 };
    }

    const groups = groupMediaByTarget(eligible);
    if (groups.length === 0) {
      return { uploaded: 0, failed: 0, skipped: 0 };
    }

    debugRecebimentoV2('photo-queue', 'process-start', {
      demandId,
      eligibleCount: eligible.length,
      groupCount: groups.length,
    });

    return processGroupsWithConcurrency(demandId, groups);
  } finally {
    processingDemands.delete(demandId);
  }
}

function cancelScheduledPhotoQueue(demandId: string): void {
  const scheduled = scheduledQueueByDemand.get(demandId);
  if (scheduled) {
    clearTimeout(scheduled);
    scheduledQueueByDemand.delete(demandId);
  }
}

function cancelAllScheduledPhotoQueues(): void {
  for (const demandId of scheduledQueueByDemand.keys()) {
    cancelScheduledPhotoQueue(demandId);
  }
}

export function triggerPhotoQueue(demandId: string, delayMs = PHOTO_QUEUE_DEBOUNCE_MS): void {
  if (!isBrowserOnline()) {
    return;
  }

  cancelScheduledPhotoQueue(demandId);

  scheduledQueueByDemand.set(
    demandId,
    setTimeout(() => {
      scheduledQueueByDemand.delete(demandId);
      void processPhotoQueue(demandId).catch((err) => {
        console.error('[PHOTO QUEUE] Falha ao processar fila', { demandId, err });
      });
    }, delayMs),
  );
}

function requestPhotoQueueForActiveDemands(): void {
  if (!isBrowserOnline()) {
    return;
  }

  for (const demandId of activeDemands) {
    triggerPhotoQueue(demandId, PHOTO_QUEUE_DEBOUNCE_MS);
  }
}

function ensureGlobalPhotoQueueListenersRegistered(): void {
  if (listenersCleanup || typeof window === 'undefined') {
    return;
  }

  const onlineHandler = () => {
    requestPhotoQueueForActiveDemands();
  };

  const offlineHandler = () => {
    cancelAllScheduledPhotoQueues();
  };

  const visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      requestPhotoQueueForActiveDemands();
    }
  };

  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);
  document.addEventListener('visibilitychange', visibilityHandler);

  const intervalId = window.setInterval(() => {
    requestPhotoQueueForActiveDemands();
  }, PHOTO_QUEUE_INTERVAL_MS);

  listenersCleanup = () => {
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
    document.removeEventListener('visibilitychange', visibilityHandler);
    window.clearInterval(intervalId);
    cancelAllScheduledPhotoQueues();
    listenersCleanup = null;
  };
}

export function registerPhotoQueueForDemand(demandId: string): () => void {
  activeDemands.add(demandId);
  ensureGlobalPhotoQueueListenersRegistered();
  triggerPhotoQueue(demandId);

  return () => {
    activeDemands.delete(demandId);
    cancelScheduledPhotoQueue(demandId);

    if (activeDemands.size === 0 && listenersCleanup) {
      listenersCleanup();
    }
  };
}

/** @internal test helper */
export function resetPhotoUploadQueueState(): void {
  cancelAllScheduledPhotoQueues();
  activeDemands.clear();
  processingDemands.clear();

  if (listenersCleanup) {
    listenersCleanup();
  }
}
