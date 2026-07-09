import type { OutboxEntry } from '../db';
import { db } from '../db';
import { getPhoto } from '../photo-store';
import { createShortId } from '@/lib/random-id';
import { buildPhotoFilename } from './filename';
import { SYNC_EXPORT_VERSION, type SyncExportEntry, type SyncExportPackage, type SyncExportScope } from './types';

function createExportId(): string {
  return createShortId(8);
}

function getRecebimentoEntryPriority(entry: Pick<OutboxEntry, 'endpoint' | 'method'>): number {
  const endpoint = entry.endpoint.toLowerCase();
  const method = entry.method.toUpperCase();

  if (method === 'PUT' && endpoint.includes('/checklist')) {
    return 0;
  }

  if (endpoint.includes('/avarias')) {
    return method === 'DELETE' ? 2.9 : 3;
  }

  if (method === 'PUT' && endpoint.includes('/encerrar')) {
    return 4;
  }

  return 2;
}

export function sortRecebimentoOutboxEntries<T extends Pick<OutboxEntry, 'endpoint' | 'method' | 'createdAt'>>(
  entries: T[],
): T[] {
  return [...entries].sort((left, right) => {
    const priorityDiff =
      getRecebimentoEntryPriority(left) - getRecebimentoEntryPriority(right);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return left.createdAt - right.createdAt;
  });
}

export async function buildSyncExportPackage(
  entries: OutboxEntry[],
  scope: SyncExportScope,
  unidadeId?: string,
): Promise<SyncExportPackage> {
  const exportId = createExportId();
  const sortedEntries = sortRecebimentoOutboxEntries(entries);
  const exportEntries: SyncExportEntry[] = [];

  for (const entry of sortedEntries) {
    if (entry.id == null) continue;

    const photoRefs = [];
    for (const photoId of entry.photoIds ?? []) {
      const photo = await getPhoto(db, photoId);
      if (!photo) continue;

      photoRefs.push({
        photoId,
        outboxId: entry.id,
        filename: buildPhotoFilename(exportId, entry.id, photoId, photo.mimeType),
        mimeType: photo.mimeType,
        relatedId: photo.relatedId,
      });
    }

    exportEntries.push({
      outboxId: entry.id,
      label: entry.label,
      endpoint: entry.endpoint,
      method: entry.method,
      payload: entry.payload,
      photoIds: entry.photoIds ?? [],
      photoRefs,
      errorMessage: entry.errorMessage,
      retries: entry.retries,
      createdAt: entry.createdAt,
      status: entry.status,
    });
  }

  return {
    version: SYNC_EXPORT_VERSION,
    exportId,
    exportedAt: new Date().toISOString(),
    scope,
    unidadeId,
    entries: exportEntries,
  };
}
