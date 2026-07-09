import { submitConferenciaBackground } from '@/features/recebimento/lib/submit-conferencia';

import { ApiClientError, isApiConfigured, sendOutboxEntry, uploadPhoto } from './api-client';
import { db } from './db';
import {
  getPendingEntries,
  markDiscarded,
  markDone,
  markError,
  markSyncing,
} from './outbox';
import { deletePhotos, getPhoto, setPhotoUploadedUrl } from './photo-store';
import { recordSuccessfulSync } from './sync-meta';
import { isRecebimentoOutboxEntry } from './sync-recebimento-import';

const AUTO_SYNC_INTERVAL_MS = 45_000;
const AUTO_SYNC_DEBOUNCE_MS = 800;

let isFlushing = false;
const flushingListeners = new Set<() => void>();
let scheduledSync: ReturnType<typeof setTimeout> | null = null;

function notifyFlushingListeners() {
  for (const listener of flushingListeners) {
    listener();
  }
}

function setFlushing(value: boolean) {
  if (isFlushing === value) return;
  isFlushing = value;
  notifyFlushingListeners();
}

export function getIsFlushing(): boolean {
  return isFlushing;
}

export function subscribeSyncFlushing(listener: () => void): () => void {
  flushingListeners.add(listener);
  return () => {
    flushingListeners.delete(listener);
  };
}

async function uploadEntryPhotos(photoIds: number[]): Promise<string[]> {
  const urls: string[] = [];

  for (const photoId of photoIds) {
    const photo = await getPhoto(db, photoId);
    if (!photo) continue;

    if (photo.uploadedUrl) {
      urls.push(photo.uploadedUrl);
      continue;
    }

    const url = await uploadPhoto(photo);
    await setPhotoUploadedUrl(db, photoId, url);
    urls.push(url);
  }

  return urls;
}

async function flushOutboxInternal(): Promise<{
  synced: number;
  failed: number;
  lastError?: string;
}> {
  let synced = 0;
  let failed = 0;
  let lastError: string | undefined;

  const entries = await getPendingEntries(db);
  // Recebimento não usa mais a outbox: a conferência é enviada em lote pelo
  // fluxo de finalização (submit-conferencia). Entradas antigas são ignoradas
  // aqui para não baterem no endpoint com o placeholder "__offline__".
  const otherEntries = entries.filter((entry) => !isRecebimentoOutboxEntry(entry));

  for (const entry of otherEntries) {
    if (entry.id == null) continue;

    try {
      await markSyncing(db, entry.id);

      const photoIds = entry.photoIds ?? [];
      const photoUrls = await uploadEntryPhotos(photoIds);
      await sendOutboxEntry(entry, photoUrls);

      if (photoIds.length > 0) {
        await deletePhotos(db, photoIds);
      }

      await markDone(db, entry.id);
      synced += 1;
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Falha ao sincronizar';
      const isPermanent =
        error instanceof ApiClientError &&
        (error.status === 422 || error.status === 409);

      if (isPermanent) {
        await markDiscarded(db, entry.id, message);
      } else {
        await markError(db, entry.id, message);
        failed += 1;
      }
      lastError = message;
    }
  }

  if (synced > 0) {
    await recordSuccessfulSync(db, synced);
  }

  return { synced, failed, lastError };
}

async function syncPendingFinalizedConferencias(): Promise<{
  synced: number;
  failed: number;
  lastError?: string;
}> {
  if (!isApiConfigured()) {
    return { synced: 0, failed: 0 };
  }

  const pendingDemands = await db.demands
    .filter((demand) => demand.pendingOfflineSync === true)
    .toArray();

  let synced = 0;
  let failed = 0;
  let lastError: string | undefined;

  for (const demand of pendingDemands) {
    const result = await submitConferenciaBackground(demand.id);

    if (result.status === 'success') {
      synced += 1;
      continue;
    }

    if (result.status === 'partial' || result.status === 'error') {
      failed += 1;
      if (result.message) {
        lastError = result.message;
      }
    }
  }

  return { synced, failed, lastError };
}

export async function hasPendingSyncWork(): Promise<boolean> {
  const pendingDemands = await db.demands
    .filter((demand) => demand.pendingOfflineSync === true)
    .count();

  if (pendingDemands > 0) {
    return true;
  }

  const entries = await getPendingEntries(db);
  return entries.some((entry) => !isRecebimentoOutboxEntry(entry));
}

export async function flushOutbox(): Promise<{
  synced: number;
  failed: number;
  lastError?: string;
}> {
  if (isFlushing || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  setFlushing(true);
  try {
    return await flushOutboxInternal();
  } finally {
    setFlushing(false);
  }
}

export async function syncNow(): Promise<{
  synced: number;
  failed: number;
  lastError?: string;
}> {
  if (isFlushing || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  setFlushing(true);
  try {
    const recebimento = await syncPendingFinalizedConferencias();
    const outbox = await flushOutboxInternal();

    return {
      synced: recebimento.synced + outbox.synced,
      failed: recebimento.failed + outbox.failed,
      lastError: outbox.lastError ?? recebimento.lastError,
    };
  } finally {
    setFlushing(false);
  }
}

function scheduleAutoSync(delayMs = AUTO_SYNC_DEBOUNCE_MS) {
  if (scheduledSync) {
    clearTimeout(scheduledSync);
  }

  scheduledSync = setTimeout(() => {
    scheduledSync = null;
    void syncNow();
  }, delayMs);
}

function requestAutoSyncIfNeeded() {
  if (!navigator.onLine) return;

  void hasPendingSyncWork().then((hasPending) => {
    if (hasPending) {
      scheduleAutoSync();
    }
  });
}

export function triggerAutoSyncIfPending(): void {
  requestAutoSyncIfNeeded();
}

export function registerOnlineSyncListener(): () => void {
  const onlineHandler = () => {
    requestAutoSyncIfNeeded();
  };

  const visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      requestAutoSyncIfNeeded();
    }
  };

  window.addEventListener('online', onlineHandler);
  document.addEventListener('visibilitychange', visibilityHandler);

  const intervalId = window.setInterval(() => {
    requestAutoSyncIfNeeded();
  }, AUTO_SYNC_INTERVAL_MS);

  requestAutoSyncIfNeeded();

  return () => {
    window.removeEventListener('online', onlineHandler);
    document.removeEventListener('visibilitychange', visibilityHandler);
    window.clearInterval(intervalId);

    if (scheduledSync) {
      clearTimeout(scheduledSync);
      scheduledSync = null;
    }
  };
}
