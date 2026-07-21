/**
 * Retry service for RC avaria photos.
 *
 * Problem: uploadPhotosForClientDamageIds requires a successful rep.push() to know
 * the serverAvariaId. When offline, push fails and photos were silently lost.
 *
 * Solution:
 *  1. Before any push attempt, persist { clientDamageId, mediaIds } in the Dexie
 *     checklist record (pendingAvariaPhotos).
 *  2. After a successful push, stamp and upload immediately.
 *  3. On connectivity error, schedule a retry via the online listener.
 *  4. On retry, query Replicache for the serverAvariaId and stamp + upload.
 */

import { listAvarias } from '@lilog/replicache-recebimento';
import type { RecebimentoReplicache } from '@lilog/replicache-recebimento';

import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import {
  stampAvariaMediaTargets,
} from '@/features/recebimento-v2/services/sync-photo.helpers';
import {
  processPhotoQueue,
  triggerPhotoQueue,
} from '@/features/recebimento-v2/services/photo-upload-queue.service';
import { getActiveReplicache } from '@/lib/replicache/replicache-registry';

const RETRY_DELAYS_MS = [500, 1500, 3000, 5000];
const MAX_RETRY_ATTEMPTS = RETRY_DELAYS_MS.length + 2;

const pendingDemands = new Set<string>();
let onlineListenerRegistered = false;
let flushTimeoutId: ReturnType<typeof setTimeout> | null = null;
let flushRetryAttempt = 0;
let flushInProgress = false;

function isBrowserOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

function clearScheduledFlush(): void {
  if (flushTimeoutId !== null) {
    clearTimeout(flushTimeoutId);
    flushTimeoutId = null;
  }
}

function registerNetworkListeners(): void {
  if (onlineListenerRegistered || typeof window === 'undefined') return;
  onlineListenerRegistered = true;

  window.addEventListener('online', () => {
    void flushPendingRcAvariaPhotoSync();
  });
  window.addEventListener('offline', () => {
    clearScheduledFlush();
  });
}

function requestPendingFlush(options?: { resetRetry?: boolean }): void {
  if (options?.resetRetry) {
    flushRetryAttempt = 0;
  }

  if (pendingDemands.size === 0 || !isBrowserOnline()) return;
  if (flushTimeoutId !== null) return;

  const delay =
    flushRetryAttempt === 0
      ? 0
      : RETRY_DELAYS_MS[Math.min(flushRetryAttempt - 1, RETRY_DELAYS_MS.length - 1)];

  flushTimeoutId = setTimeout(() => {
    flushTimeoutId = null;
    void runPendingFlush();
  }, delay ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]);
}

async function runPendingFlush(): Promise<void> {
  if (flushInProgress) {
    requestPendingFlush();
    return;
  }

  if (!isBrowserOnline() || pendingDemands.size === 0) return;

  const rep = getActiveReplicache();
  if (!rep) {
    flushRetryAttempt += 1;
    if (flushRetryAttempt <= MAX_RETRY_ATTEMPTS) requestPendingFlush();
    return;
  }

  flushInProgress = true;
  const demandIds = [...pendingDemands];

  try {
    for (const demandId of demandIds) {
      await processRcAvariaPhotosForDemand(rep, demandId, { fromFlush: true });
    }

    if (pendingDemands.size === 0) {
      flushRetryAttempt = 0;
      return;
    }

    flushRetryAttempt += 1;
    if (flushRetryAttempt <= MAX_RETRY_ATTEMPTS) requestPendingFlush();
  } finally {
    flushInProgress = false;
  }
}

/**
 * Persists clientDamageId → mediaIds mapping in Dexie before a push attempt.
 * This ensures photos survive page reloads and offline periods.
 */
export async function enqueueRcAvariaPhotos(
  preRecebimentoId: string,
  clientDamageId: string,
  mediaIds: string[],
): Promise<void> {
  if (mediaIds.length === 0) return;

  const existing = await recebimentoV2Db.checklists.get(preRecebimentoId);
  const currentPending = existing?.pendingAvariaPhotos ?? [];

  const filtered = currentPending.filter((p) => p.clientDamageId !== clientDamageId);
  filtered.push({ clientDamageId, mediaIds });

  if (existing) {
    await recebimentoV2Db.checklists.update(preRecebimentoId, {
      pendingAvariaPhotos: filtered,
      updatedAt: Date.now(),
    });
  } else {
    await recebimentoV2Db.checklists.put({
      demandId: preRecebimentoId,
      id: crypto.randomUUID(),
      dock: '',
      lacre: '',
      conditions: {},
      savedAt: new Date().toISOString(),
      syncStatus: 'synced',
      pendingAvariaPhotos: filtered,
      updatedAt: Date.now(),
    });
  }

  pendingDemands.add(preRecebimentoId);
  registerNetworkListeners();
}

/**
 * Removes a specific clientDamageId from the pending avaria photos queue.
 * Called after successful stamp + upload, or when avaria is removed.
 */
export async function dequeueRcAvariaPhotos(
  preRecebimentoId: string,
  clientDamageId: string,
): Promise<void> {
  const existing = await recebimentoV2Db.checklists.get(preRecebimentoId);
  if (!existing?.pendingAvariaPhotos?.length) return;

  const filtered = existing.pendingAvariaPhotos.filter(
    (p) => p.clientDamageId !== clientDamageId,
  );

  await recebimentoV2Db.checklists.update(preRecebimentoId, {
    pendingAvariaPhotos: filtered.length > 0 ? filtered : undefined,
    updatedAt: Date.now(),
  });

  if (filtered.length === 0) {
    pendingDemands.delete(preRecebimentoId);
  }
}

/**
 * Removes all pending photo entries for a set of clientDamageIds.
 * Called when limparAvarias removes all avarias.
 */
export async function dequeueAllRcAvariaPhotos(
  preRecebimentoId: string,
): Promise<void> {
  const existing = await recebimentoV2Db.checklists.get(preRecebimentoId);
  if (!existing) return;

  await recebimentoV2Db.checklists.update(preRecebimentoId, {
    pendingAvariaPhotos: undefined,
    updatedAt: Date.now(),
  });

  pendingDemands.delete(preRecebimentoId);
}

/**
 * Resolves serverAvariaId from Replicache for a given clientDamageId.
 * After a successful push+pull, the avaria view's id becomes the serverAvariaId.
 * We use clientDamageId field to match, since id changes after server confirmation.
 */
async function resolveServerAvariaId(
  rep: RecebimentoReplicache,
  preRecebimentoId: string,
  clientDamageId: string,
): Promise<string | null> {
  const avarias = await rep.query((tx) => listAvarias(tx, preRecebimentoId));
  const avaria = avarias.find((a) => a.clientDamageId === clientDamageId);
  if (!avaria) {
    return null;
  }

  // Guard against optimistic echo: while only local mutation exists, `id` can
  // still be the clientDamageId. We only accept confirmed server IDs.
  return avaria.id !== clientDamageId ? avaria.id : null;
}

type ProcessOptions = { fromFlush?: boolean };

/**
 * Processes all pending avaria photo uploads for a demand.
 * For each pending entry, resolves the serverAvariaId from Replicache,
 * stamps the media records, and triggers the photo upload queue.
 */
export async function processRcAvariaPhotosForDemand(
  rep: RecebimentoReplicache,
  preRecebimentoId: string,
  options?: ProcessOptions,
): Promise<void> {
  const checklist = await recebimentoV2Db.checklists.get(preRecebimentoId);
  if (!checklist?.pendingAvariaPhotos?.length) {
    pendingDemands.delete(preRecebimentoId);
    return;
  }

  if (!isBrowserOnline()) {
    pendingDemands.add(preRecebimentoId);
    return;
  }

  try {
    await rep.pull({ now: true });
  } catch {
    // Best-effort refresh. If pull fails, we keep pending and retry later.
  }

  let anyStamped = false;
  const stillPending: Array<{ clientDamageId: string; mediaIds: string[] }> = [];

  for (const entry of checklist.pendingAvariaPhotos) {
    const serverAvariaId = await resolveServerAvariaId(
      rep,
      preRecebimentoId,
      entry.clientDamageId,
    );

    if (!serverAvariaId) {
      // Avaria not yet confirmed by server — keep in queue
      stillPending.push(entry);
      continue;
    }

    await stampAvariaMediaTargets(entry.mediaIds, serverAvariaId);
    anyStamped = true;
    // Remove stamped entry from the queue
    await dequeueRcAvariaPhotos(preRecebimentoId, entry.clientDamageId);
  }

  if (anyStamped) {
    triggerPhotoQueue(preRecebimentoId);
  }

  if (stillPending.length > 0) {
    // Items not yet confirmed by server: retry when back online after pull
    pendingDemands.add(preRecebimentoId);
    scheduleRcAvariaPhotoSync(preRecebimentoId, options);
  }
}

/**
 * Schedules a retry for pending avaria photo sync.
 */
export function scheduleRcAvariaPhotoSync(
  preRecebimentoId: string,
  options?: ProcessOptions,
): void {
  pendingDemands.add(preRecebimentoId);
  registerNetworkListeners();

  if (isBrowserOnline()) {
    requestPendingFlush({ resetRetry: !options?.fromFlush });
  }
}

/**
 * Flushes all pending avaria photo syncs.
 * Called on network restore and when Replicache becomes ready.
 */
export async function flushPendingRcAvariaPhotoSync(): Promise<void> {
  if (!isBrowserOnline()) return;

  // Re-hydrate from Dexie in case the page was reloaded
  const checklists = await recebimentoV2Db.checklists.toArray();
  for (const checklist of checklists) {
    if (checklist.pendingAvariaPhotos?.length) {
      pendingDemands.add(checklist.demandId);
    }
  }

  if (pendingDemands.size === 0) return;

  const rep = getActiveReplicache();
  if (!rep) {
    requestPendingFlush({ resetRetry: true });
    return;
  }

  flushRetryAttempt = 0;
  const demandIds = [...pendingDemands];
  for (const demandId of demandIds) {
    await processRcAvariaPhotosForDemand(rep, demandId);
  }
}

/** Returns runtime queue state for debug panels. */
export function getRcAvariaPhotoSyncState() {
  return {
    pendingDemands: [...pendingDemands],
    flushInProgress,
    flushRetryAttempt,
    flushScheduled: flushTimeoutId !== null,
  };
}

/**
 * Removes one demand from the avaria photo retry queue.
 * Optionally clears persisted pendingAvariaPhotos on checklist record.
 */
export async function discardRcAvariaPhotoQueueForDemand(
  demandId: string,
  options?: { clearPersisted?: boolean },
): Promise<void> {
  pendingDemands.delete(demandId);

  if (!options?.clearPersisted) {
    return;
  }

  await recebimentoV2Db.checklists.update(demandId, {
    pendingAvariaPhotos: undefined,
    updatedAt: Date.now(),
  });
}
