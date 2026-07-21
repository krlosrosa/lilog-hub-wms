import type { ChecklistPhotoMediaIds } from '../local-db/schema';
import { recebimentoV2Db } from '../local-db/db';
import { uppyBucketUpload } from '@/lib/uppy/uppy-bucket-upload';

import { resolveRecebimentoIdForDemand } from './sync-photo.helpers';

const CHECKLIST_ENTIDADE_TIPO = 'checklist_recebimento';

const CHECKLIST_SLOT_UPLOAD_NAMES: Record<keyof ChecklistPhotoMediaIds, string> = {
  lacre: 'lacre',
  bauFechado: 'bau-fechado',
  bauAberto: 'bau-aberto',
  extras: 'extras',
};

export interface ChecklistPhotoUploadResult {
  uploaded: number;
  failed: number;
  skipped: number;
}

/**
 * Uploads checklist photos from local IndexedDB media to document storage.
 * Skips media already marked as uploaded. Does not throw on individual failures.
 */
export async function uploadChecklistPhotosV2(
  recebimentoId: string,
  photoMediaIds: ChecklistPhotoMediaIds | undefined,
): Promise<ChecklistPhotoUploadResult> {
  if (!photoMediaIds) {
    return { uploaded: 0, failed: 0, skipped: 0 };
  }

  const uploadTargets: Array<{ slotUploadName: string; mediaId: string }> = [];

  for (const [slotKey, slotUploadName] of Object.entries(
    CHECKLIST_SLOT_UPLOAD_NAMES,
  ) as Array<[keyof ChecklistPhotoMediaIds, string]>) {
    for (const mediaId of photoMediaIds[slotKey] ?? []) {
      uploadTargets.push({ slotUploadName, mediaId });
    }
  }

  if (uploadTargets.length === 0) {
    return { uploaded: 0, failed: 0, skipped: 0 };
  }

  const records = (await recebimentoV2Db.media.bulkGet(uploadTargets.map((target) => target.mediaId))).filter(
    (record): record is NonNullable<typeof record> => record != null,
  );

  const nomeByMediaId = new Map(
    uploadTargets.map((target) => [
      target.mediaId,
      `checklist-${target.slotUploadName}-${target.mediaId}.jpg`,
    ]),
  );

  return uppyBucketUpload(records, {
    entidadeTipo: CHECKLIST_ENTIDADE_TIPO,
    entidadeId: recebimentoId,
    sessionLabel: `Upload checklist ${recebimentoId.slice(0, 8)}`,
    nome: (record) => nomeByMediaId.get(record.id) ?? `checklist-${record.id}.jpg`,
  });
}

/**
 * Uploads pending checklist photos for a demand, resolving recebimentoId from cache or API.
 */
export async function ensureChecklistPhotosUploaded(
  demandId: string,
  recebimentoId?: string | null,
): Promise<ChecklistPhotoUploadResult> {
  const resolvedRecebimentoId = await resolveRecebimentoIdForDemand(
    demandId,
    recebimentoId,
  );

  if (!resolvedRecebimentoId) {
    return { uploaded: 0, failed: 0, skipped: 0 };
  }

  const checklist = await recebimentoV2Db.checklists.get(demandId);
  if (!checklist?.photoMediaIds) {
    return { uploaded: 0, failed: 0, skipped: 0 };
  }

  return uploadChecklistPhotosV2(resolvedRecebimentoId, checklist.photoMediaIds);
}
