import { recebimentoV2Db } from '../local-db/db';

import {
  hasDirtyPatchWork,
  syncNowV2,
} from './auto-sync-v2.service';
import { hasPendingPhotoUploads } from './sync-photo.helpers';

/**
 * Pushes pending local work for every prepared demand in the unit.
 * Used on the demand list so sync continues after leaving a demand screen.
 */
export async function flushPendingSyncForUnidade(unidadeId: string): Promise<void> {
  if (!unidadeId || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    return;
  }

  const processes = await recebimentoV2Db.processes
    .where('unidadeId')
    .equals(unidadeId)
    .toArray();

  for (const process of processes) {
    if (process.status === 'notDownloaded' || process.status === 'downloading') {
      continue;
    }

    const [hasDirtyWork, hasPhotos] = await Promise.all([
      hasDirtyPatchWork(process.id),
      hasPendingPhotoUploads(process.id),
    ]);

    if (!hasDirtyWork && !hasPhotos) {
      continue;
    }

    try {
      await syncNowV2(process.id, { manual: true });
    } catch {
      // Best effort: other demands still get a chance to sync.
    }
  }
}
