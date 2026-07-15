import { recebimentoV2Db } from '../local-db/db';
import {
  isOpAutoSyncable,
  isOpRetryExhausted,
  RECEBIMENTO_V2_RETRY_POLICY,
} from '../lib/sync-retry-policy';
import { debugRecebimentoV2 } from '../lib/sync-debug';

import { hasPendingPhotoUploads } from './sync-photo.helpers';
import { pushDemand, type PushResult } from './sync.service';

const AUTO_SYNC_INTERVAL_MS = 45_000;
const AUTO_SYNC_DEBOUNCE_MS = 800;
const MAX_CONSECUTIVE_AUTO_SYNC_ERRORS = RECEBIMENTO_V2_RETRY_POLICY.maxAttempts;

const activeDemands = new Set<string>();
const scheduledSyncByDemand = new Map<string, ReturnType<typeof setTimeout>>();
const consecutiveErrorsByDemand = new Map<string, number>();
const pausedDemands = new Set<string>();

let isPushing = false;
let listenersCleanup: (() => void) | null = null;

function isBrowserOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }

  return navigator.onLine !== false;
}

export async function hasPendingSyncWork(demandId: string): Promise<boolean> {
  const count = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .and((op) => op.status === 'pending' || op.status === 'retry')
    .count();

  return count > 0;
}

export async function hasAutoSyncableWork(demandId: string): Promise<boolean> {
  const ops = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .and((op) => op.status === 'pending' || op.status === 'retry')
    .toArray();

  if (ops.some((op) => isOpAutoSyncable(op))) {
    return true;
  }

  return hasPendingPhotoUploads(demandId);
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

export function scheduleAutoSync(
  demandId: string,
  delayMs = AUTO_SYNC_DEBOUNCE_MS,
): void {
  if (!isBrowserOnline() || pausedDemands.has(demandId)) return;

  cancelScheduledAutoSync(demandId);

  scheduledSyncByDemand.set(
    demandId,
    setTimeout(() => {
      scheduledSyncByDemand.delete(demandId);

      if (!isBrowserOnline() || pausedDemands.has(demandId)) return;

      void syncNowV2(demandId);
    }, delayMs),
  );
}

export function triggerAutoSyncIfPending(demandId: string): void {
  if (!isBrowserOnline() || pausedDemands.has(demandId)) return;

  void hasAutoSyncableWork(demandId).then((hasWork) => {
    if (hasWork) {
      scheduleAutoSync(demandId);
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

  if (isPushing && !options?.manual) {
    return null;
  }

  if (!options?.manual && (await isDemandAutoSyncPaused(demandId))) {
    return null;
  }

  const process = await recebimentoV2Db.processes.get(demandId);
  if (!process || process.status === 'conflict') {
    return null;
  }

  const hasWork = options?.manual
    ? (await hasPendingSyncWork(demandId)) || (await hasPendingPhotoUploads(demandId))
    : await hasAutoSyncableWork(demandId);

  if (!hasWork) {
    return null;
  }

  isPushing = true;
  try {
    const result = await pushDemand(demandId, { manual: options?.manual });
    consecutiveErrorsByDemand.delete(demandId);
    await refreshAutoSyncPauseState(demandId);
    return result;
  } catch {
    recordAutoSyncFailure(demandId);
    await refreshAutoSyncPauseState(demandId);
    return null;
  } finally {
    isPushing = false;
  }
}

export async function syncNowV2(
  demandId: string,
  options?: { manual?: boolean },
): Promise<PushResult | null> {
  if (options?.manual) {
    resetAutoSyncBackoff(demandId);
  }

  return autoPushDemandIfNeeded(demandId, options);
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

  const [process, ops, hasWork] = await Promise.all([
    recebimentoV2Db.processes.get(demandId),
    recebimentoV2Db.syncOperations.where('aggregateId').equals(demandId).toArray(),
    hasAutoSyncableWork(demandId),
  ]);

  debugRecebimentoV2('sync', 'registerAutoSync', {
    demandId,
    autoSyncPaused: process?.autoSyncPaused ?? false,
    pausedInMemory: pausedDemands.has(demandId),
    hasAutoSyncableWork: hasWork,
    opsByStatus: ops.reduce<Record<string, number>>((acc, op) => {
      acc[op.status] = (acc[op.status] ?? 0) + 1;
      return acc;
    }, {}),
  });

  triggerAutoSyncIfPending(demandId);

  return () => {
    activeDemands.delete(demandId);
    cancelScheduledAutoSync(demandId);

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
  isPushing = false;

  if (listenersCleanup) {
    listenersCleanup();
  }
}
