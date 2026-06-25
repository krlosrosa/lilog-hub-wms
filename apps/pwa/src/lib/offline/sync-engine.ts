import { ApiClientError, sendOutboxEntry, uploadPhoto } from './api-client';
import { db } from './db';
import { syncChecklistDrafts } from './sync-checklist-drafts';
import {
  getPendingEntries,
  markDone,
  markError,
  markSyncing,
} from './outbox';
import { deletePhotos, getPhoto, setPhotoUploadedUrl } from './photo-store';
import { recordSuccessfulSync } from './sync-meta';

let isFlushing = false;

export function getIsFlushing(): boolean {
  return isFlushing;
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

export async function flushOutbox(): Promise<{
  synced: number;
  failed: number;
  lastError?: string;
}> {
  if (isFlushing || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  isFlushing = true;
  let synced = 0;
  let failed = 0;
  let lastError: string | undefined;

  try {
    await syncChecklistDrafts();

    const entries = await getPendingEntries(db);

    for (const entry of entries) {
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
        await markError(db, entry.id, message);
        lastError = message;
        failed += 1;
      }
    }

    if (synced > 0) {
      await recordSuccessfulSync(db, synced);
    }
  } finally {
    isFlushing = false;
  }

  return { synced, failed, lastError };
}

export function syncNow(): Promise<{
  synced: number;
  failed: number;
  lastError?: string;
}> {
  return flushOutbox();
}

export function registerOnlineSyncListener(): () => void {
  const handler = () => {
    void flushOutbox();
  };

  window.addEventListener('online', handler);

  if (navigator.onLine) {
    void flushOutbox();
  }

  return () => window.removeEventListener('online', handler);
}
