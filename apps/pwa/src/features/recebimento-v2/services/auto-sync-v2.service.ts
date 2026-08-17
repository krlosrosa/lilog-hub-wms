import { RECEBIMENTO_V2_OP_TYPES, type DemandPatchResult } from '@lilog/contracts';

import { isRevisionConflictError } from '../lib/sync-revision-conflict';
import { recebimentoV2Db } from '../local-db/db';
import {
  isOpRetryExhausted,
  RECEBIMENTO_V2_RETRY_POLICY,
} from '../lib/sync-retry-policy';
import { debugRecebimentoV2 } from '../lib/sync-debug';

import { countPendingPhotoUploads, hasPendingPhotoUploads } from './sync-photo.helpers';
import { pushDemand, type PushResult } from './sync.service';
import { pushDemandPatchFromLocal } from './push-demand-patch.service';
import { reconcileOrphanedPendingSyncOps } from './mark-sync-ops-for-patch.service';
import {
  processPhotoQueue,
  registerPhotoQueueForDemand,
  resetPhotoUploadQueueState,
  triggerPhotoQueue,
} from './photo-upload-queue.service';

const AUTO_SYNC_INTERVAL_MS = 45_000;
const AUTO_SYNC_DEBOUNCE_MS = 800;
const MAX_CONSECUTIVE_AUTO_SYNC_ERRORS = RECEBIMENTO_V2_RETRY_POLICY.maxAttempts;

const activeDemands = new Set<string>();
const scheduledSyncByDemand = new Map<string, ReturnType<typeof setTimeout>>();
const consecutiveErrorsByDemand = new Map<string, number>();
const pausedDemands = new Set<string>();
const pushingDemands = new Set<string>();

let listenersCleanup: (() => void) | null = null;

function isBrowserOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }

  return navigator.onLine !== false;
}

function isDirtyStatus(status: string): boolean {
  return status === 'pending' || status === 'retry' || status === 'syncing';
}

export async function hasPendingSyncWork(demandId: string): Promise<boolean> {
  const count = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .and((op) => op.status === 'pending' || op.status === 'retry')
    .count();

  return count > 0;
}

export async function hasDirtyPatchWork(demandId: string): Promise<boolean> {
  const [
    process,
    checklist,
    dirtyConferences,
    dirtyDamages,
    dirtyTemperatures,
    dirtyImpedimento,
    encerrarOrRetomarOp,
  ] = await Promise.all([
    recebimentoV2Db.processes.get(demandId),
    recebimentoV2Db.checklists.get(demandId),
    recebimentoV2Db.conferences
      .where('demandId')
      .equals(demandId)
      .filter((record) => isDirtyStatus(record.syncStatus))
      .count(),
    recebimentoV2Db.damages
      .where('demandId')
      .equals(demandId)
      .filter((record) => isDirtyStatus(record.syncStatus))
      .count(),
    recebimentoV2Db.temperatures
      .where('demandId')
      .equals(demandId)
      .filter((record) => isDirtyStatus(record.syncStatus))
      .count(),
    recebimentoV2Db.impedimentos
      .where('demandId')
      .equals(demandId)
      .filter((record) => isDirtyStatus(record.syncStatus))
      .first(),
    recebimentoV2Db.syncOperations
      .where('aggregateId')
      .equals(demandId)
      .and(
        (op) =>
          (op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_ENCERRAR ||
            op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_RETOMAR) &&
          (op.status === 'pending' || op.status === 'retry'),
      )
      .count(),
  ]);

  return (
    process?.pendingFinalizationSync === true ||
    (checklist != null && isDirtyStatus(checklist.syncStatus)) ||
    dirtyConferences > 0 ||
    dirtyDamages > 0 ||
    dirtyTemperatures > 0 ||
    dirtyImpedimento != null ||
    encerrarOrRetomarOp > 0
  );
}

async function hasExhaustedSyncOps(demandId: string): Promise<boolean> {
  const ops = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .and((op) => op.status === 'pending' || op.status === 'retry')
    .toArray();

  return ops.some((op) => isOpRetryExhausted(op));
}

async function shouldPauseAutoSync(demandId: string): Promise<boolean> {
  if ((consecutiveErrorsByDemand.get(demandId) ?? 0) >= MAX_CONSECUTIVE_AUTO_SYNC_ERRORS) {
    return true;
  }

  return hasExhaustedSyncOps(demandId);
}

export async function refreshAutoSyncPauseState(demandId: string): Promise<boolean> {
  const shouldPause = await shouldPauseAutoSync(demandId);

  if (shouldPause) {
    pausedDemands.add(demandId);
    await recebimentoV2Db.processes.update(demandId, { autoSyncPaused: true });
    return true;
  }

  pausedDemands.delete(demandId);
  await recebimentoV2Db.processes.update(demandId, { autoSyncPaused: false });
  return false;
}

async function hydrateAutoSyncPauseState(demandId: string): Promise<void> {
  const process = await recebimentoV2Db.processes.get(demandId);
  if (process?.autoSyncPaused) {
    pausedDemands.add(demandId);
    return;
  }

  await refreshAutoSyncPauseState(demandId);
}

async function isDemandAutoSyncPaused(demandId: string): Promise<boolean> {
  if (pausedDemands.has(demandId)) {
    return true;
  }

  const process = await recebimentoV2Db.processes.get(demandId);
  if (process?.autoSyncPaused) {
    pausedDemands.add(demandId);
    return true;
  }

  return false;
}

export function getAutoSyncPaused(demandId: string): boolean {
  return pausedDemands.has(demandId);
}

export function resetAutoSyncBackoff(demandId: string): void {
  consecutiveErrorsByDemand.delete(demandId);
  pausedDemands.delete(demandId);
  void recebimentoV2Db.processes.update(demandId, { autoSyncPaused: false });
}

function recordAutoSyncFailure(demandId: string): void {
  const next = (consecutiveErrorsByDemand.get(demandId) ?? 0) + 1;
  consecutiveErrorsByDemand.set(demandId, next);
}

function cancelScheduledAutoSync(demandId: string): void {
  const scheduled = scheduledSyncByDemand.get(demandId);
  if (scheduled) {
    clearTimeout(scheduled);
    scheduledSyncByDemand.delete(demandId);
  }
}

function cancelAllScheduledAutoSync(): void {
  for (const demandId of scheduledSyncByDemand.keys()) {
    cancelScheduledAutoSync(demandId);
  }
}

function patchResultToPushResult(result: DemandPatchResult): PushResult {
  return {
    accepted:
      (result.applied.conferencias?.accepted ?? 0) +
      (result.applied.avarias?.accepted ?? 0) +
      (result.applied.temperaturas?.accepted ?? 0) +
      (result.applied.checklist ? 1 : 0) +
      (result.applied.impedimento ? 1 : 0) +
      (result.applied.encerrado ? 1 : 0),
    rejected:
      (result.applied.conferencias?.rejected ?? 0) +
      (result.applied.avarias?.rejected ?? 0) +
      (result.applied.temperaturas?.rejected ?? 0),
    conflicts: result.conflicts?.length ?? 0,
    newRevision: result.serverRevision,
    photosUploaded: 0,
    photosFailed: 0,
    photosPending: 0,
  };
}

function mergePushResults(base: PushResult, extra: PushResult): PushResult {
  return {
    accepted: base.accepted + extra.accepted,
    rejected: base.rejected + extra.rejected,
    conflicts: base.conflicts + extra.conflicts,
    newRevision: Math.max(base.newRevision, extra.newRevision),
    photosUploaded: base.photosUploaded + extra.photosUploaded,
    photosFailed: base.photosFailed + extra.photosFailed,
    photosPending: extra.photosPending,
  };
}

async function buildPhotoOnlyPushResult(demandId: string): Promise<PushResult> {
  const process = await recebimentoV2Db.processes.get(demandId);
  const photoResult = await processPhotoQueue(demandId);
  const pendingCounts = await countPendingPhotoUploads(demandId);

  return {
    accepted: 0,
    rejected: 0,
    conflicts: 0,
    newRevision: process?.serverRevision ?? 0,
    photosUploaded: photoResult.uploaded,
    photosFailed: photoResult.failed,
    photosPending:
      pendingCounts.pending + pendingCounts.uploading + pendingCounts.error,
  };
}

export function scheduleAutoSync(
  demandId: string,
  delayMs = AUTO_SYNC_DEBOUNCE_MS,
): void {
  if (!isBrowserOnline()) return;

  cancelScheduledAutoSync(demandId);

  scheduledSyncByDemand.set(
    demandId,
    setTimeout(() => {
      scheduledSyncByDemand.delete(demandId);

      if (!isBrowserOnline()) return;

      void syncNowV2(demandId);
    }, delayMs),
  );
}

export function triggerAutoSyncIfPending(demandId: string): void {
  if (!isBrowserOnline()) return;

  void hasDirtyPatchWork(demandId).then((hasWork) => {
    if (hasWork && !pausedDemands.has(demandId)) {
      scheduleAutoSync(demandId);
    }
  });

  void hasPendingPhotoUploads(demandId).then((hasPhotos) => {
    if (hasPhotos) {
      triggerPhotoQueue(demandId);
    }
  });
}

async function autoPushDemandIfNeeded(
  demandId: string,
  options?: { manual?: boolean },
): Promise<PushResult | null> {
  if (!isBrowserOnline()) {
    return null;
  }

  if (pushingDemands.has(demandId) && !options?.manual) {
    return null;
  }

  if (!options?.manual && (await isDemandAutoSyncPaused(demandId))) {
    return null;
  }

  const process = await recebimentoV2Db.processes.get(demandId);
  if (!process || process.status === 'conflict') {
    return null;
  }

  await reconcileOrphanedPendingSyncOps(demandId);

  const hasPatch = await hasDirtyPatchWork(demandId);
  const hasPendingOps = options?.manual ? await hasPendingSyncWork(demandId) : false;
  const hasWork = hasPatch || hasPendingOps;

  if (!hasWork) {
    return null;
  }

  pushingDemands.add(demandId);
  try {
    let result: PushResult | null = null;

    if (hasPatch) {
      const patchResult = await pushDemandPatchFromLocal(demandId);
      if (patchResult) {
        result = patchResultToPushResult(patchResult);
      }
    } else if (hasPendingOps) {
      result = await pushDemand(demandId, { manual: options?.manual });
    }

    consecutiveErrorsByDemand.delete(demandId);
    await refreshAutoSyncPauseState(demandId);
    triggerPhotoQueue(demandId);
    return result;
  } catch (err) {
    if (isRevisionConflictError(err)) {
      resetAutoSyncBackoff(demandId);
      triggerAutoSyncIfPending(demandId);
      return null;
    }

    recordAutoSyncFailure(demandId);
    await refreshAutoSyncPauseState(demandId);
    return null;
  } finally {
    pushingDemands.delete(demandId);
  }
}

export async function syncNowV2(
  demandId: string,
  options?: { manual?: boolean },
): Promise<PushResult | null> {
  if (options?.manual) {
    resetAutoSyncBackoff(demandId);
  }

  const dataResult = await autoPushDemandIfNeeded(demandId, options);
  const shouldProcessPhotos =
    options?.manual || (await hasPendingPhotoUploads(demandId));

  if (!shouldProcessPhotos) {
    return dataResult;
  }

  const photoResult = await buildPhotoOnlyPushResult(demandId);
  triggerPhotoQueue(demandId);

  if (dataResult) {
    return mergePushResults(dataResult, photoResult);
  }

  return photoResult;
}

function requestAutoSyncForActiveDemands(): void {
  if (!isBrowserOnline()) return;

  for (const demandId of activeDemands) {
    triggerAutoSyncIfPending(demandId);
  }
}

function ensureGlobalListenersRegistered(): void {
  if (listenersCleanup || typeof window === 'undefined') return;

  const onlineHandler = () => {
    for (const demandId of activeDemands) {
      consecutiveErrorsByDemand.delete(demandId);
      void refreshAutoSyncPauseState(demandId).finally(() => {
        triggerAutoSyncIfPending(demandId);
      });
    }
  };

  const offlineHandler = () => {
    cancelAllScheduledAutoSync();
  };

  const visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      requestAutoSyncForActiveDemands();
    }
  };

  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);
  document.addEventListener('visibilitychange', visibilityHandler);

  const intervalId = window.setInterval(() => {
    requestAutoSyncForActiveDemands();
  }, AUTO_SYNC_INTERVAL_MS);

  listenersCleanup = () => {
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
    document.removeEventListener('visibilitychange', visibilityHandler);
    window.clearInterval(intervalId);
    cancelAllScheduledAutoSync();
    listenersCleanup = null;
  };
}

export async function registerAutoSyncForDemand(demandId: string): Promise<() => void> {
  activeDemands.add(demandId);
  ensureGlobalListenersRegistered();
  await hydrateAutoSyncPauseState(demandId);
  const unregisterPhotoQueue = registerPhotoQueueForDemand(demandId);

  const [process, ops, hasWork] = await Promise.all([
    recebimentoV2Db.processes.get(demandId),
    recebimentoV2Db.syncOperations.where('aggregateId').equals(demandId).toArray(),
    hasDirtyPatchWork(demandId),
  ]);

  debugRecebimentoV2('sync', 'registerAutoSync', {
    demandId,
    autoSyncPaused: process?.autoSyncPaused ?? false,
    pausedInMemory: pausedDemands.has(demandId),
    hasDirtyPatchWork: hasWork,
    opsByStatus: ops.reduce<Record<string, number>>((acc, op) => {
      acc[op.status] = (acc[op.status] ?? 0) + 1;
      return acc;
    }, {}),
  });

  triggerAutoSyncIfPending(demandId);

  return () => {
    activeDemands.delete(demandId);
    cancelScheduledAutoSync(demandId);
    unregisterPhotoQueue();

    if (activeDemands.size === 0 && listenersCleanup) {
      listenersCleanup();
    }
  };
}

/** @internal test helper */
export function resetAutoSyncV2State(): void {
  cancelAllScheduledAutoSync();
  activeDemands.clear();
  consecutiveErrorsByDemand.clear();
  pausedDemands.clear();
  pushingDemands.clear();

  resetPhotoUploadQueueState();

  if (listenersCleanup) {
    listenersCleanup();
  }
}
