import { recebimentoV2Db } from '../local-db/db';

import { hasPendingPhotoUploads } from './sync-photo.helpers';
import { pushDemand, type PushResult } from './sync.service';

const AUTO_SYNC_INTERVAL_MS = 45_000;
const AUTO_SYNC_DEBOUNCE_MS = 800;
const MAX_CONSECUTIVE_AUTO_SYNC_ERRORS = 3;

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

export function getAutoSyncPaused(demandId: string): boolean {
  return pausedDemands.has(demandId);
}

export function resetAutoSyncBackoff(demandId: string): void {
  consecutiveErrorsByDemand.delete(demandId);
  pausedDemands.delete(demandId);
  void recebimentoV2Db.processes.update(demandId, { autoSyncPaused: false });
}

function recordAutoSyncSuccess(demandId: string): void {
  consecutiveErrorsByDemand.delete(demandId);
  pausedDemands.delete(demandId);
  void recebimentoV2Db.processes.update(demandId, { autoSyncPaused: false });
}

function recordAutoSyncFailure(demandId: string): void {
  const next = (consecutiveErrorsByDemand.get(demandId) ?? 0) + 1;
  consecutiveErrorsByDemand.set(demandId, next);

  if (next >= MAX_CONSECUTIVE_AUTO_SYNC_ERRORS) {
    pausedDemands.add(demandId);
    void recebimentoV2Db.processes.update(demandId, { autoSyncPaused: true });
  }
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

  void Promise.all([hasPendingSyncWork(demandId), hasPendingPhotoUploads(demandId)]).then(
    ([hasPending, hasPhotos]) => {
      if (hasPending || hasPhotos) {
        scheduleAutoSync(demandId);
      }
    },
  );
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

  if (pausedDemands.has(demandId) && !options?.manual) {
    return null;
  }

  const process = await recebimentoV2Db.processes.get(demandId);
  if (!process || process.status === 'conflict') {
    return null;
  }

  const hasPending = await hasPendingSyncWork(demandId);
  const hasPhotos = await hasPendingPhotoUploads(demandId);
  if (!hasPending && !hasPhotos) {
    return null;
  }

  isPushing = true;
  try {
    const result = await pushDemand(demandId);
    recordAutoSyncSuccess(demandId);
    return result;
  } catch {
    recordAutoSyncFailure(demandId);
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
      resetAutoSyncBackoff(demandId);
    }
    requestAutoSyncForActiveDemands();
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

export function registerAutoSyncForDemand(demandId: string): () => void {
  activeDemands.add(demandId);
  ensureGlobalListenersRegistered();
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
