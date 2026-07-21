import type { ChecklistView } from '@lilog/contracts';
import { getChecklist, getDemanda } from '@lilog/replicache-recebimento';
import type { RecebimentoReplicache } from '@lilog/replicache-recebimento';

import { countChecklistPhotoMediaIds } from '@/features/recebimento-v2/lib/checklist-sync-payload';
import type {
  ChecklistPhotoMediaIds,
  ChecklistRecord,
  SyncOperationStatus,
} from '@/features/recebimento-v2/local-db/schema';
import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import {
  collectChecklistPhotoIds,
  hasPendingPhotoUploads,
  resolveRecebimentoIdForDemand,
  stampChecklistMediaTargets,
} from '@/features/recebimento-v2/services/sync-photo.helpers';
import { processPhotoQueue, triggerPhotoQueue } from '@/features/recebimento-v2/services/photo-upload-queue.service';
import { ApiClientError } from '@/lib/offline/api-client';
import {
  isEncerrarAlreadyClosedPushError,
  isValidationPushError,
  parsePushErrorMessage,
} from '@/lib/replicache/parse-push-error';
import { getActiveReplicache } from '@/lib/replicache/replicache-registry';

import { fetchRcServerDemandStatus } from '../lib/rc-server-sync-status';
import { flushPendingRcAvariaPhotoSync } from './sync-avaria-photos-rc.service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: string | undefined): value is string {
  return value != null && UUID_RE.test(value);
}

export interface PersistRcChecklistParams {
  dockId?: string;
  dock: string;
  lacre: string;
  tempBau?: number;
  conditions: Record<string, boolean>;
  observacoes?: string;
  responsavelId?: number;
  photoMediaIds: ChecklistPhotoMediaIds;
}

export interface PersistRcFinalizacaoParams {
  quantidadePaletes: number;
  teveSobreposicaoCarga: boolean;
}

const pendingSyncDemands = new Set<string>();
const pendingFinalizacaoDemands = new Set<string>();
const RETRY_DELAYS_MS = [500, 1500, 3000, 5000];
const MAX_FLUSH_RETRIES = RETRY_DELAYS_MS.length + 2;

let onlineListenerRegistered = false;
let flushTimeoutId: ReturnType<typeof setTimeout> | null = null;
let flushRetryAttempt = 0;
let flushInProgress = false;
let finalizacaoFlushTimeoutId: ReturnType<typeof setTimeout> | null = null;
let finalizacaoFlushRetryAttempt = 0;
let finalizacaoFlushInProgress = false;

function isBrowserOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }

  return navigator.onLine !== false;
}

function clearScheduledFlush(): void {
  if (flushTimeoutId !== null) {
    clearTimeout(flushTimeoutId);
    flushTimeoutId = null;
  }
}

function requestPendingFlush(options?: { resetRetry?: boolean }): void {
  if (options?.resetRetry) {
    flushRetryAttempt = 0;
  }

  if (pendingSyncDemands.size === 0 || !isBrowserOnline()) {
    return;
  }

  if (flushTimeoutId !== null) {
    return;
  }

  const delay =
    flushRetryAttempt === 0
      ? 0
      : RETRY_DELAYS_MS[Math.min(flushRetryAttempt - 1, RETRY_DELAYS_MS.length - 1)];

  flushTimeoutId = setTimeout(() => {
    flushTimeoutId = null;
    void runPendingFlush();
  }, delay);
}

async function runPendingFlush(): Promise<void> {
  if (flushInProgress) {
    requestPendingFlush();
    return;
  }

  await enqueuePendingChecklistsFromDexie();

  if (!isBrowserOnline() || pendingSyncDemands.size === 0) {
    return;
  }

  const rep = getActiveReplicache();
  if (!rep) {
    flushRetryAttempt += 1;
    if (flushRetryAttempt <= MAX_FLUSH_RETRIES) {
      requestPendingFlush();
    }
    return;
  }

  flushInProgress = true;
  const demandIds = [...pendingSyncDemands];

  try {
    for (const demandId of demandIds) {
      await syncRcChecklistPhotos(rep, demandId, { fromFlush: true });
    }

    if (pendingSyncDemands.size === 0) {
      flushRetryAttempt = 0;
      return;
    }

    flushRetryAttempt += 1;
    if (flushRetryAttempt <= MAX_FLUSH_RETRIES) {
      requestPendingFlush();
    }
  } finally {
    flushInProgress = false;
  }
}

function registerNetworkListeners(): void {
  if (onlineListenerRegistered || typeof window === 'undefined') {
    return;
  }

  onlineListenerRegistered = true;
  window.addEventListener('online', () => {
    void flushPendingRcChecklistPhotoSync();
    void flushPendingRcFinalizacaoSync();
    void flushPendingRcAvariaPhotoSync();
  });
  window.addEventListener('offline', () => {
    clearScheduledFlush();
    clearScheduledFinalizacaoFlush();
  });
}

function deferRcChecklistPhotoSync(demandId: string): void {
  pendingSyncDemands.add(demandId);
  registerNetworkListeners();
}

function scheduleRcChecklistPhotoSyncRetry(
  demandId: string,
  options?: { resetRetry?: boolean },
): void {
  deferRcChecklistPhotoSync(demandId);

  if (isBrowserOnline()) {
    requestPendingFlush(options);
  }
}

async function enqueuePendingChecklistsFromDexie(): Promise<void> {
  const checklists = await recebimentoV2Db.checklists.toArray();

  for (const checklist of checklists) {
    if (checklist.syncStatus === 'pending' || checklist.syncStatus === 'error') {
      pendingSyncDemands.add(checklist.demandId);
    }

    if (needsRcFinalizationSync(checklist)) {
      pendingFinalizacaoDemands.add(checklist.demandId);
    }

    if (collectChecklistPhotoIds(checklist.photoMediaIds).length === 0) {
      continue;
    }

    const pendingPhotos = await hasPendingPhotoUploads(checklist.demandId);
    if (pendingPhotos) {
      pendingSyncDemands.add(checklist.demandId);
    }
  }

  registerNetworkListeners();
}

/** Retries pending checklist sync from Dexie when Replicache becomes ready or network returns. */
export async function flushPendingRcChecklistPhotoSync(): Promise<void> {
  if (!isBrowserOnline()) {
    return;
  }

  await enqueuePendingChecklistsFromDexie();

  if (pendingSyncDemands.size === 0) {
    return;
  }

  requestPendingFlush({ resetRetry: true });
}

function isConnectivityError(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    return true;
  }

  if (error && typeof error === 'object') {
    const anyError = error as { name?: string; message?: string };
    const message = anyError.message ?? '';

    if (anyError.name === 'TypeError' && message.includes('fetch')) {
      return true;
    }

    if (
      message.includes('conectar à API') ||
      message.includes('Sem conexão') ||
      message.includes('Failed to fetch') ||
      message.includes('NetworkError') ||
      message.includes('ERR_CONNECTION_REFUSED') ||
      message.includes('ERR_INTERNET_DISCONNECTED') ||
      message.includes('Load failed') ||
      message.includes('net::ERR_')
    ) {
      return true;
    }
  }

  return false;
}

function isReplicacheClosedOrIdbClosingError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const anyError = error as { name?: string; message?: string };
    const name = anyError.name ?? '';
    const message = anyError.message ?? '';

    if (name === 'InvalidStateError') {
      return true;
    }

    if (typeof message === 'string') {
      if (message === 'Closed') {
        return true;
      }

      if (message.toLowerCase().includes('database connection is closing')) {
        return true;
      }
    }
  }

  return false;
}

function isRecoverableSyncError(error: unknown): boolean {
  return (
    isConnectivityError(error) || isReplicacheClosedOrIdbClosingError(error)
  );
}

async function updateRcChecklistSyncStatus(
  demandId: string,
  syncStatus: SyncOperationStatus,
): Promise<void> {
  const existing = await recebimentoV2Db.checklists.get(demandId);
  if (!existing) {
    return;
  }

  await recebimentoV2Db.checklists.update(demandId, {
    syncStatus,
    updatedAt: Date.now(),
  });
}

export async function persistRcChecklistForPhotoUpload(
  demandId: string,
  params: PersistRcChecklistParams,
): Promise<void> {
  const now = new Date().toISOString();
  const nowMs = Date.now();
  const existing = await recebimentoV2Db.checklists.get(demandId);

  const record: ChecklistRecord = {
    demandId,
    id: existing?.id ?? crypto.randomUUID(),
    dockId: isValidUuid(params.dockId) ? params.dockId : existing?.dockId,
    dock: params.dock,
    lacre: params.lacre,
    tempBau: params.tempBau,
    conditions: params.conditions,
    observacoes: params.observacoes,
    responsavelId: params.responsavelId,
    photoMediaIds: params.photoMediaIds,
    savedAt: now,
    syncStatus: 'pending',
    pendingFinalizationSync: existing?.pendingFinalizationSync,
    finalizacaoPayload: existing?.finalizacaoPayload,
    localFinalizationAttempted: existing?.localFinalizationAttempted,
    finalizationServerConfirmed: existing?.finalizationServerConfirmed,
    updatedAt: nowMs,
  };

  await recebimentoV2Db.checklists.put(record);
  deferRcChecklistPhotoSync(demandId);
  triggerPhotoQueue(demandId);
}

function localChecklistNeedsReplicacheSync(
  local: ChecklistRecord,
  remote: ChecklistView | null | undefined,
): boolean {
  if (!remote?.lacre?.trim()) {
    return true;
  }

  if (remote.lacre !== local.lacre) {
    return true;
  }

  if ((remote.tempBau ?? null) !== (local.tempBau ?? null)) {
    return true;
  }

  if ((remote.dock ?? '').trim() !== local.dock.trim()) {
    return true;
  }

  return false;
}

async function ensureRcChecklistMutationFromLocal(
  rep: RecebimentoReplicache,
  preRecebimentoId: string,
): Promise<boolean> {
  const local = await recebimentoV2Db.checklists.get(preRecebimentoId);
  if (!local) {
    return false;
  }

  if (local.syncStatus !== 'pending' && local.syncStatus !== 'error') {
    return false;
  }

  const remote = await rep.query((tx) => getChecklist(tx, preRecebimentoId));
  if (!localChecklistNeedsReplicacheSync(local, remote)) {
    return false;
  }

  const photoMediaIds: ChecklistPhotoMediaIds = local.photoMediaIds ?? {
    lacre: [],
    bauFechado: [],
    bauAberto: [],
    extras: [],
  };

  const dockId = isValidUuid(local.dockId) ? local.dockId : undefined;

  await rep.mutate.upsertChecklist({
    preRecebimentoId,
    dockId,
    dockLabel: local.dock,
    lacre: local.lacre,
    tempBau: local.tempBau ?? null,
    conditions: local.conditions,
    observacoes: local.observacoes,
    photoCount: countChecklistPhotoMediaIds(photoMediaIds),
    photoMediaIds,
    responsavelId: local.responsavelId,
    clientChecklistId: local.id,
  });

  return true;
}

async function resolveRecebimentoIdFromReplicache(
  rep: RecebimentoReplicache,
  preRecebimentoId: string,
): Promise<string | null> {
  return rep.query(async (tx) => {
    const [checklistView, demandView] = await Promise.all([
      getChecklist(tx, preRecebimentoId),
      getDemanda(tx, preRecebimentoId),
    ]);

    return checklistView?.recebimentoId ?? demandView?.recebimentoId ?? null;
  });
}

async function resolveRecebimentoIdForRcSync(
  rep: RecebimentoReplicache,
  preRecebimentoId: string,
): Promise<string | null> {
  const fromReplicache = await resolveRecebimentoIdFromReplicache(
    rep,
    preRecebimentoId,
  );
  if (fromReplicache) {
    return fromReplicache;
  }

  if (!isBrowserOnline()) {
    return null;
  }

  try {
    return await resolveRecebimentoIdForDemand(preRecebimentoId, null);
  } catch (error) {
    if (isConnectivityError(error)) {
      return null;
    }

    throw error;
  }
}

async function hasRcChecklistPhotosToUpload(demandId: string): Promise<boolean> {
  const checklist = await recebimentoV2Db.checklists.get(demandId);
  if (!checklist?.photoMediaIds) {
    return false;
  }

  const photoIds = collectChecklistPhotoIds(checklist.photoMediaIds);
  if (photoIds.length === 0) {
    return false;
  }

  return hasPendingPhotoUploads(demandId);
}

async function readChecklistFromReplicache(
  rep: RecebimentoReplicache,
  preRecebimentoId: string,
): Promise<ChecklistView | null> {
  return rep.query((tx) => getChecklist(tx, preRecebimentoId));
}

type SyncRcChecklistPhotosOptions = {
  fromFlush?: boolean;
};

export async function syncRcChecklistPhotos(
  rep: RecebimentoReplicache,
  preRecebimentoId: string,
  options?: SyncRcChecklistPhotosOptions,
): Promise<void> {
  const localChecklist = await recebimentoV2Db.checklists.get(preRecebimentoId);
  const shouldUploadPhotos = await hasRcChecklistPhotosToUpload(preRecebimentoId);
  const needsSync =
    localChecklist?.syncStatus === 'pending' ||
    localChecklist?.syncStatus === 'error' ||
    shouldUploadPhotos;

  if (!needsSync) {
    pendingSyncDemands.delete(preRecebimentoId);
    return;
  }

  if (!isBrowserOnline()) {
    deferRcChecklistPhotoSync(preRecebimentoId);
    return;
  }

  try {
    await ensureRcChecklistMutationFromLocal(rep, preRecebimentoId);

    try {
      await rep.push({ now: true });
    } catch (error) {
      const message = parsePushErrorMessage(error);
      if (isValidationPushError(message)) {
        console.warn('[checklist-rc] push validation failed:', message);
        await updateRcChecklistSyncStatus(preRecebimentoId, 'error');
        pendingSyncDemands.delete(preRecebimentoId);
        return;
      }

      if (isRecoverableSyncError(error)) {
        scheduleRcChecklistPhotoSyncRetry(preRecebimentoId, {
          resetRetry: !options?.fromFlush,
        });
        return;
      }
    }

    try {
      await rep.pull({ now: true });
    } catch (error) {
      if (isRecoverableSyncError(error)) {
        scheduleRcChecklistPhotoSyncRetry(preRecebimentoId, {
          resetRetry: !options?.fromFlush,
        });
        return;
      }

      throw error;
    }

    const checklistAfterSync = await readChecklistFromReplicache(rep, preRecebimentoId);
    if (!checklistAfterSync?.lacre?.trim()) {
      scheduleRcChecklistPhotoSyncRetry(preRecebimentoId, {
        resetRetry: !options?.fromFlush,
      });
      return;
    }

    if (!shouldUploadPhotos) {
      await updateRcChecklistSyncStatus(preRecebimentoId, 'synced');
      pendingSyncDemands.delete(preRecebimentoId);
      return;
    }

    let recebimentoId = await resolveRecebimentoIdForRcSync(rep, preRecebimentoId);
    if (!recebimentoId) {
      await rep.pull({ now: true }).catch(() => undefined);
      recebimentoId = await resolveRecebimentoIdForRcSync(rep, preRecebimentoId);
    }

    if (!recebimentoId) {
      scheduleRcChecklistPhotoSyncRetry(preRecebimentoId, {
        resetRetry: !options?.fromFlush,
      });
      return;
    }

    const checklist = await recebimentoV2Db.checklists.get(preRecebimentoId);
    await stampChecklistMediaTargets(
      collectChecklistPhotoIds(checklist?.photoMediaIds),
      recebimentoId,
    );
    await processPhotoQueue(preRecebimentoId);

    const stillPendingPhotos = await hasPendingPhotoUploads(preRecebimentoId);
    if (stillPendingPhotos) {
      scheduleRcChecklistPhotoSyncRetry(preRecebimentoId, {
        resetRetry: !options?.fromFlush,
      });
      return;
    }

    await updateRcChecklistSyncStatus(preRecebimentoId, 'synced');
    pendingSyncDemands.delete(preRecebimentoId);
  } catch (error) {
    if (isRecoverableSyncError(error)) {
      scheduleRcChecklistPhotoSyncRetry(preRecebimentoId, {
        resetRetry: !options?.fromFlush,
      });
      return;
    }

    console.warn('[checklist-rc] photo sync failed:', error);
    scheduleRcChecklistPhotoSyncRetry(preRecebimentoId, {
      resetRetry: !options?.fromFlush,
    });
  }
}

export async function syncAllPendingRcChecklistPhotos(
  rep: RecebimentoReplicache,
): Promise<void> {
  if (!isBrowserOnline()) {
    return;
  }

  await enqueuePendingChecklistsFromDexie();

  const demandIds = [...pendingSyncDemands];
  for (const demandId of demandIds) {
    await syncRcChecklistPhotos(rep, demandId);
  }
}

function clearScheduledFinalizacaoFlush(): void {
  if (finalizacaoFlushTimeoutId !== null) {
    clearTimeout(finalizacaoFlushTimeoutId);
    finalizacaoFlushTimeoutId = null;
  }
}

function requestPendingFinalizacaoFlush(options?: { resetRetry?: boolean }): void {
  if (options?.resetRetry) {
    finalizacaoFlushRetryAttempt = 0;
  }

  if (pendingFinalizacaoDemands.size === 0 || !isBrowserOnline()) {
    return;
  }

  if (finalizacaoFlushTimeoutId !== null) {
    return;
  }

  const delay =
    finalizacaoFlushRetryAttempt === 0
      ? 0
      : RETRY_DELAYS_MS[
          Math.min(finalizacaoFlushRetryAttempt - 1, RETRY_DELAYS_MS.length - 1)
        ];

  finalizacaoFlushTimeoutId = setTimeout(() => {
    finalizacaoFlushTimeoutId = null;
    void runPendingFinalizacaoFlush();
  }, delay);
}

async function runPendingFinalizacaoFlush(): Promise<void> {
  if (finalizacaoFlushInProgress) {
    requestPendingFinalizacaoFlush();
    return;
  }

  await enqueuePendingChecklistsFromDexie();

  if (!isBrowserOnline() || pendingFinalizacaoDemands.size === 0) {
    return;
  }

  const rep = getActiveReplicache();
  if (!rep) {
    finalizacaoFlushRetryAttempt += 1;
    if (finalizacaoFlushRetryAttempt <= MAX_FLUSH_RETRIES) {
      requestPendingFinalizacaoFlush();
    }
    return;
  }

  finalizacaoFlushInProgress = true;
  const demandIds = [...pendingFinalizacaoDemands];

  try {
    for (const demandId of demandIds) {
      await syncRcFinalizacaoPendente(rep, demandId, { fromFlush: true });
    }

    if (pendingFinalizacaoDemands.size === 0) {
      finalizacaoFlushRetryAttempt = 0;
      return;
    }

    finalizacaoFlushRetryAttempt += 1;
    if (finalizacaoFlushRetryAttempt <= MAX_FLUSH_RETRIES) {
      requestPendingFinalizacaoFlush();
    }
  } finally {
    finalizacaoFlushInProgress = false;
  }
}

function deferRcFinalizacaoSync(demandId: string): void {
  pendingFinalizacaoDemands.add(demandId);
  registerNetworkListeners();
}

function scheduleRcFinalizacaoSyncRetry(
  demandId: string,
  options?: { resetRetry?: boolean },
): void {
  deferRcFinalizacaoSync(demandId);

  if (isBrowserOnline()) {
    requestPendingFinalizacaoFlush(options);
  }
}

export async function persistRcFinalizacaoPendente(
  demandId: string,
  params: PersistRcFinalizacaoParams,
): Promise<void> {
  const nowMs = Date.now();
  const existing = await recebimentoV2Db.checklists.get(demandId);

  if (existing) {
    await recebimentoV2Db.checklists.update(demandId, {
      pendingFinalizationSync: true,
      finalizacaoPayload: params,
      localFinalizationAttempted: true,
      finalizationServerConfirmed: false,
      updatedAt: nowMs,
    });
  } else {
    const record: ChecklistRecord = {
      demandId,
      id: crypto.randomUUID(),
      dock: '',
      lacre: '',
      conditions: {},
      savedAt: new Date().toISOString(),
      syncStatus: 'synced',
      pendingFinalizationSync: true,
      finalizacaoPayload: params,
      localFinalizationAttempted: true,
      finalizationServerConfirmed: false,
      updatedAt: nowMs,
    };
    await recebimentoV2Db.checklists.put(record);
  }

  deferRcFinalizacaoSync(demandId);
}

async function dismissRcFinalizacaoPendente(demandId: string): Promise<void> {
  const existing = await recebimentoV2Db.checklists.get(demandId);
  if (!existing) {
    return;
  }

  await recebimentoV2Db.checklists.update(demandId, {
    pendingFinalizationSync: false,
    updatedAt: Date.now(),
  });
  pendingFinalizacaoDemands.delete(demandId);
}

async function confirmRcFinalizacaoOnServer(demandId: string): Promise<void> {
  const existing = await recebimentoV2Db.checklists.get(demandId);
  if (!existing) {
    return;
  }

  await recebimentoV2Db.checklists.update(demandId, {
    pendingFinalizationSync: false,
    finalizacaoPayload: undefined,
    finalizationServerConfirmed: true,
    updatedAt: Date.now(),
  });
  pendingFinalizacaoDemands.delete(demandId);
}

function needsRcFinalizationSync(local: ChecklistRecord | undefined): local is ChecklistRecord {
  if (!local) {
    return false;
  }

  if (local.pendingFinalizationSync) {
    return true;
  }

  return Boolean(
    local.localFinalizationAttempted &&
      !local.finalizationServerConfirmed &&
      local.finalizacaoPayload,
  );
}

type SyncRcFinalizacaoOptions = {
  fromFlush?: boolean;
};

async function ensureRcEncerrarMutationQueued(
  rep: RecebimentoReplicache,
  preRecebimentoId: string,
  local: ChecklistRecord,
): Promise<void> {
  if (!local.finalizacaoPayload) {
    return;
  }

  const demand = await rep.query((tx) => getDemanda(tx, preRecebimentoId));
  if (demand?.situacao === 'conferido') {
    return;
  }

  const serverStatus = await fetchRcServerDemandStatus(preRecebimentoId);
  if (serverStatus?.isConferido) {
    await confirmRcFinalizacaoOnServer(preRecebimentoId);
    return;
  }

  await rep.mutate.encerrarConferencia({
    preRecebimentoId,
    quantidadePaletes: local.finalizacaoPayload.quantidadePaletes,
    teveSobreposicaoCarga: local.finalizacaoPayload.teveSobreposicaoCarga,
  });
}

async function syncRcChecklistBeforeFinalizacao(
  rep: RecebimentoReplicache,
  preRecebimentoId: string,
  local: ChecklistRecord,
  options?: SyncRcFinalizacaoOptions,
): Promise<void> {
  const shouldUploadPhotos = await hasRcChecklistPhotosToUpload(preRecebimentoId);
  const checklistNeedsSync =
    local.syncStatus === 'pending' ||
    local.syncStatus === 'error' ||
    shouldUploadPhotos;

  if (!checklistNeedsSync) {
    return;
  }

  await syncRcChecklistPhotos(rep, preRecebimentoId, options);
}

export async function syncRcFinalizacaoPendente(
  rep: RecebimentoReplicache,
  preRecebimentoId: string,
  options?: SyncRcFinalizacaoOptions,
): Promise<void> {
  const local = await recebimentoV2Db.checklists.get(preRecebimentoId);
  if (!needsRcFinalizationSync(local)) {
    pendingFinalizacaoDemands.delete(preRecebimentoId);
    return;
  }

  if (!isBrowserOnline()) {
    deferRcFinalizacaoSync(preRecebimentoId);
    return;
  }

  try {
    console.debug('[finalizar-rc] sync start', preRecebimentoId);
    await syncRcChecklistBeforeFinalizacao(rep, preRecebimentoId, local, options);
    await ensureRcEncerrarMutationQueued(rep, preRecebimentoId, local);

    try {
      await rep.push({ now: true });
    } catch (error) {
      const message = parsePushErrorMessage(error);
      if (isEncerrarAlreadyClosedPushError(message)) {
        const serverStatus = await fetchRcServerDemandStatus(preRecebimentoId);
        if (serverStatus?.isConferido) {
          console.debug(
            '[finalizar-rc] push skipped — servidor já conferido',
            preRecebimentoId,
          );
          await confirmRcFinalizacaoOnServer(preRecebimentoId);
          try {
            await rep.pull({ now: true });
          } catch {
            // Best-effort refresh after idempotent close on server.
          }
          return;
        }
      }
      if (isValidationPushError(message)) {
        console.warn('[finalizar-rc] push validation failed:', message);
        await dismissRcFinalizacaoPendente(preRecebimentoId);
        return;
      }

      if (isRecoverableSyncError(error)) {
        scheduleRcFinalizacaoSyncRetry(preRecebimentoId, {
          resetRetry: !options?.fromFlush,
        });
        return;
      }

      throw error;
    }

    try {
      await rep.pull({ now: true });
    } catch (error) {
      if (isRecoverableSyncError(error)) {
        scheduleRcFinalizacaoSyncRetry(preRecebimentoId, {
          resetRetry: !options?.fromFlush,
        });
        return;
      }

      throw error;
    }

    const serverStatus = await fetchRcServerDemandStatus(preRecebimentoId);
    if (serverStatus?.isConferido) {
      console.debug('[finalizar-rc] sync confirmed on server', preRecebimentoId);
      await confirmRcFinalizacaoOnServer(preRecebimentoId);
      return;
    }

    console.debug(
      '[finalizar-rc] server not conferido yet',
      preRecebimentoId,
      serverStatus?.situacao,
    );

    scheduleRcFinalizacaoSyncRetry(preRecebimentoId, {
      resetRetry: !options?.fromFlush,
    });
  } catch (error) {
    if (isRecoverableSyncError(error)) {
      scheduleRcFinalizacaoSyncRetry(preRecebimentoId, {
        resetRetry: !options?.fromFlush,
      });
      return;
    }

    console.warn('[finalizar-rc] sync failed:', error);
    scheduleRcFinalizacaoSyncRetry(preRecebimentoId, {
      resetRetry: !options?.fromFlush,
    });
  }
}

/** Schedules best-effort push of pending encerrarConferencia mutations. */
export function scheduleRcFinalizacaoSync(preRecebimentoId: string): void {
  scheduleRcFinalizacaoSyncRetry(preRecebimentoId, { resetRetry: true });
}

/** Retries pending finalization sync from Dexie when Replicache becomes ready or network returns. */
export async function flushPendingRcFinalizacaoSync(): Promise<void> {
  if (!isBrowserOnline()) {
    return;
  }

  await enqueuePendingChecklistsFromDexie();

  if (pendingFinalizacaoDemands.size === 0) {
    return;
  }

  const rep = getActiveReplicache();
  if (!rep) {
    requestPendingFinalizacaoFlush({ resetRetry: true });
    return;
  }

  finalizacaoFlushRetryAttempt = 0;
  const demandIds = [...pendingFinalizacaoDemands];

  for (const demandId of demandIds) {
    await syncRcFinalizacaoPendente(rep, demandId);
  }
}

/** Runtime queue state for sync debug panel. */
export function getRcSyncRuntimeState() {
  return {
    pendingChecklistDemands: [...pendingSyncDemands],
    pendingFinalizacaoDemands: [...pendingFinalizacaoDemands],
    checklistFlushInProgress: flushInProgress,
    finalizacaoFlushInProgress: finalizacaoFlushInProgress,
    checklistFlushRetryAttempt: flushRetryAttempt,
    finalizacaoFlushRetryAttempt: finalizacaoFlushRetryAttempt,
    checklistFlushScheduled: flushTimeoutId !== null,
    finalizacaoFlushScheduled: finalizacaoFlushTimeoutId !== null,
  };
}

/**
 * Removes one demand from checklist/finalization retry queues.
 * Can also clear persisted local sync intents for that demand.
 */
export async function discardRcSyncQueueForDemand(
  demandId: string,
  options?: { clearChecklistSync?: boolean; clearFinalizacaoSync?: boolean; clearChecklistPhotos?: boolean },
): Promise<void> {
  pendingSyncDemands.delete(demandId);
  pendingFinalizacaoDemands.delete(demandId);

  if (
    !options?.clearChecklistSync &&
    !options?.clearFinalizacaoSync &&
    !options?.clearChecklistPhotos
  ) {
    return;
  }

  const current = await recebimentoV2Db.checklists.get(demandId);
  if (!current) {
    return;
  }

  await recebimentoV2Db.checklists.update(demandId, {
    syncStatus: options?.clearChecklistSync ? 'synced' : current.syncStatus,
    pendingFinalizationSync: options?.clearFinalizacaoSync
      ? false
      : current.pendingFinalizationSync,
    finalizacaoPayload: options?.clearFinalizacaoSync
      ? undefined
      : current.finalizacaoPayload,
    localFinalizationAttempted: options?.clearFinalizacaoSync
      ? false
      : current.localFinalizationAttempted,
    finalizationServerConfirmed: options?.clearFinalizacaoSync
      ? false
      : current.finalizationServerConfirmed,
    photoMediaIds: options?.clearChecklistPhotos ? undefined : current.photoMediaIds,
    updatedAt: Date.now(),
  });
}
