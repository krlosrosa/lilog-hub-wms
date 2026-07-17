import { UploadError, uploadDocumentToBucket } from '@/lib/offline/document-upload';

import type { ChecklistPhotoMediaIds } from '../local-db/schema';
import { recebimentoV2Db } from '../local-db/db';

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

type UploadAttempt = 'uploaded' | 'failed' | 'skipped';

async function uploadSingleChecklistMedia(
  recebimentoId: string,
  slotUploadName: string,
  mediaId: string,
): Promise<UploadAttempt> {
  const media = await recebimentoV2Db.media.get(mediaId);
  if (!media || media.status === 'uploaded') {
    return 'skipped';
  }

  if (!media.blob) {
    const errorMessage = 'Blob não encontrado no armazenamento local';
    console.error(
      `[PHOTO UPLOAD] tipo=${CHECKLIST_ENTIDADE_TIPO} mediaId=${mediaId}`,
      errorMessage,
    );
    await recebimentoV2Db.media.update(mediaId, {
      status: 'error',
      errorMessage,
      errorStep: 'unknown',
    });
    return 'failed';
  }

  try {
    await recebimentoV2Db.media.update(mediaId, { status: 'uploading' });

    const remoteUrl = await uploadDocumentToBucket(
      {
        blob: media.blob,
        mimeType: media.mimeType,
      },
      {
        nome: `checklist-${slotUploadName}-${mediaId}.jpg`,
        entidadeTipo: CHECKLIST_ENTIDADE_TIPO,
        entidadeId: recebimentoId,
      },
    );

    await recebimentoV2Db.media.update(mediaId, {
      status: 'uploaded',
      remoteUrl,
      uploadedAt: new Date().toISOString(),
      errorMessage: undefined,
      errorStep: undefined,
    });

    return 'uploaded';
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(
      `[PHOTO UPLOAD] tipo=${CHECKLIST_ENTIDADE_TIPO} mediaId=${mediaId}`,
      err,
    );
    await recebimentoV2Db.media.update(mediaId, {
      status: 'error',
      errorMessage,
      errorStep: err instanceof UploadError ? err.step : 'unknown',
    });
    return 'failed';
  }
}

/**
 * Uploads checklist photos from local IndexedDB media to document storage.
 * Skips media already marked as uploaded. Does not throw on individual failures.
 */
export async function uploadChecklistPhotosV2(
  recebimentoId: string,
  photoMediaIds: ChecklistPhotoMediaIds | undefined,
): Promise<ChecklistPhotoUploadResult> {
  const result: ChecklistPhotoUploadResult = {
    uploaded: 0,
    failed: 0,
    skipped: 0,
  };

  if (!photoMediaIds) {
    return result;
  }

  for (const [slotKey, slotUploadName] of Object.entries(
    CHECKLIST_SLOT_UPLOAD_NAMES,
  ) as Array<[keyof ChecklistPhotoMediaIds, string]>) {
    const mediaIds = photoMediaIds[slotKey] ?? [];

    for (const mediaId of mediaIds) {
      const attempt = await uploadSingleChecklistMedia(
        recebimentoId,
        slotUploadName,
        mediaId,
      );

      if (attempt === 'uploaded') {
        result.uploaded += 1;
      } else if (attempt === 'failed') {
        result.failed += 1;
      } else {
        result.skipped += 1;
      }
    }
  }

  return result;
}
