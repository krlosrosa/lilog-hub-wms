import { db } from '../db';
import { getPhoto } from '../photo-store';
import { buildJsonFilename } from './filename';
import type { SyncExportPackage } from './types';

const DOWNLOAD_GAP_MS = 350;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadJsonFile(pkg: SyncExportPackage): void {
  const blob = new Blob([JSON.stringify(pkg, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerBlobDownload(blob, buildJsonFilename(pkg.exportId));
}

export async function copyJsonToClipboard(pkg: SyncExportPackage): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(pkg, null, 2));
}

export async function downloadExportPhoto(
  photoId: number,
  filename: string,
): Promise<boolean> {
  const photo = await getPhoto(db, photoId);
  if (!photo) return false;

  triggerBlobDownload(photo.blob, filename);
  return true;
}

export async function downloadAllExportPhotos(
  pkg: SyncExportPackage,
  onProgress?: (current: number, total: number) => void,
): Promise<{ downloaded: number; failed: number }> {
  const photoRefs = pkg.entries.flatMap((entry) => entry.photoRefs);
  let downloaded = 0;
  let failed = 0;

  for (let index = 0; index < photoRefs.length; index += 1) {
    const ref = photoRefs[index];
    const success = await downloadExportPhoto(ref.photoId, ref.filename);
    if (success) {
      downloaded += 1;
    } else {
      failed += 1;
    }

    onProgress?.(index + 1, photoRefs.length);

    if (index < photoRefs.length - 1) {
      await delay(DOWNLOAD_GAP_MS);
    }
  }

  return { downloaded, failed };
}
