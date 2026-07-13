import { recebimentoV2Db } from '../local-db/db.js';
import type { MediaRecord } from '../local-db/schema.js';

/**
 * Saves a media blob and its metadata atomically with a domain operation.
 * Returns the local media ID (UUID).
 */
export async function captureMedia(
  processId: string,
  ownerType: MediaRecord['ownerType'],
  ownerId: string,
  blob: Blob,
  mimeType: string,
  filename?: string,
): Promise<string> {
  const id = crypto.randomUUID();
  const checksum = await computeChecksum(blob);

  const record: MediaRecord = {
    id,
    processId,
    ownerType,
    ownerId,
    blob,
    mimeType,
    checksum,
    filename,
    status: 'local',
    createdAt: new Date().toISOString(),
  };

  await recebimentoV2Db.media.add(record);
  return id;
}

/**
 * Uploads pending media blobs to the server.
 * Idempotent: won't duplicate if already uploaded (checksum match).
 * Only removes blob from local store after server confirms the link.
 */
export async function uploadPendingMedia(): Promise<void> {
  const pendingMedia = await recebimentoV2Db.media
    .where('status')
    .equals('local')
    .toArray();

  for (const media of pendingMedia) {
    await uploadSingleMedia(media);
  }
}

async function uploadSingleMedia(media: MediaRecord): Promise<void> {
  if (!media.blob) return;

  try {
    await recebimentoV2Db.media.update(media.id, { status: 'uploading' });

    const formData = new FormData();
    formData.append('file', media.blob, media.filename ?? media.id);
    formData.append('checksum', media.checksum ?? '');
    formData.append('ownerId', media.ownerId);
    formData.append('ownerType', media.ownerType);

    const response = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Upload failed');
      throw new Error(errorText);
    }

    const { url } = (await response.json()) as { url: string };

    await recebimentoV2Db.media.update(media.id, {
      status: 'uploaded',
      remoteUrl: url,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    await recebimentoV2Db.media.update(media.id, {
      status: 'error',
    });
    throw error;
  }
}

/**
 * Removes blobs from local storage for confirmed media (uploaded + linked).
 * Does NOT remove the MediaRecord itself - only frees blob storage.
 * Call this only after the server confirms the media link.
 */
export async function releaseBlobAfterConfirmation(
  mediaId: string,
): Promise<void> {
  const media = await recebimentoV2Db.media.get(mediaId);
  if (!media || media.status !== 'uploaded') return;

  await recebimentoV2Db.media.update(mediaId, {
    blob: undefined as unknown as Blob,
  });
}

/**
 * Checks available storage quota and returns remaining bytes.
 * Returns null if the Storage API is not available.
 */
export async function checkStorageQuota(): Promise<{
  quota: number;
  usage: number;
  available: number;
} | null> {
  if (!navigator.storage?.estimate) return null;

  const { quota = 0, usage = 0 } = await navigator.storage.estimate();
  return {
    quota,
    usage,
    available: quota - usage,
  };
}

/**
 * Computes SHA-256 checksum of a blob.
 */
async function computeChecksum(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
