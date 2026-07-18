import { UploadError, uploadDocumentToBucket } from '@/lib/offline/document-upload';

import { recebimentoV2Db } from '../local-db/db';

const IMPEDIMENTO_ENTIDADE_TIPO = 'impedimento_recebimento';

export interface ImpedimentoPhotoUploadResult {
  uploaded: number;
  failed: number;
  skipped: number;
}

type UploadAttempt = 'uploaded' | 'failed' | 'skipped';

async function uploadSingleImpedimentoMedia(
  preRecebimentoId: string,
  mediaId: string,
): Promise<UploadAttempt> {
  const media = await recebimentoV2Db.media.get(mediaId);
  if (!media || media.status === 'uploaded') {
    return 'skipped';
  }

  if (!media.blob) {
    const errorMessage = 'Blob não encontrado no armazenamento local';
    console.error(
      `[PHOTO UPLOAD] tipo=${IMPEDIMENTO_ENTIDADE_TIPO} mediaId=${mediaId}`,
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
        nome: `impedimento-${mediaId}.jpg`,
        entidadeTipo: IMPEDIMENTO_ENTIDADE_TIPO,
        entidadeId: preRecebimentoId,
      },
    );

    await recebimentoV2Db.media.update(mediaId, {
      status: 'uploaded',
      remoteUrl,
      uploadedAt: new Date().toISOString(),
      blob: undefined as unknown as Blob,
      errorMessage: undefined,
      errorStep: undefined,
    });

    return 'uploaded';
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(
      `[PHOTO UPLOAD] tipo=${IMPEDIMENTO_ENTIDADE_TIPO} mediaId=${mediaId}`,
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
 * Uploads impedimento evidence photos from local IndexedDB media to document storage.
 */
export async function uploadImpedimentoPhotosV2(
  preRecebimentoId: string,
  mediaIds: string[] | undefined,
): Promise<ImpedimentoPhotoUploadResult> {
  const result: ImpedimentoPhotoUploadResult = {
    uploaded: 0,
    failed: 0,
    skipped: 0,
  };

  if (!mediaIds?.length) {
    return result;
  }

  for (const mediaId of mediaIds) {
    const attempt = await uploadSingleImpedimentoMedia(preRecebimentoId, mediaId);

    if (attempt === 'uploaded') {
      result.uploaded += 1;
    } else if (attempt === 'failed') {
      result.failed += 1;
    } else {
      result.skipped += 1;
    }
  }

  return result;
}
