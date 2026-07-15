import { uploadDocumentToBucket } from '@/lib/offline/document-upload';

import { recebimentoV2Db } from '../local-db/db';

export interface AvariaPhotoUploadResult {
  uploaded: number;
  failed: number;
  skipped: number;
}

type UploadAttempt = 'uploaded' | 'failed' | 'skipped';

async function uploadSingleAvariaMedia(
  avariaId: string,
  mediaId: string,
): Promise<UploadAttempt> {
  const media = await recebimentoV2Db.media.get(mediaId);
  if (!media || media.status === 'uploaded') {
    return 'skipped';
  }

  if (!media.blob) {
    await recebimentoV2Db.media.update(mediaId, { status: 'error' });
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
        nome: `avaria-${mediaId}.jpg`,
        entidadeTipo: 'recebimento_avaria',
        entidadeId: avariaId,
      },
    );

    await recebimentoV2Db.media.update(mediaId, {
      status: 'uploaded',
      remoteUrl,
      uploadedAt: new Date().toISOString(),
    });

    return 'uploaded';
  } catch {
    await recebimentoV2Db.media.update(mediaId, { status: 'error' });
    return 'failed';
  }
}

/**
 * Uploads avaria evidence photos from local IndexedDB media to document storage.
 * Skips media already marked as uploaded. Does not throw on individual failures.
 */
export async function uploadAvariaPhotosV2(
  avariaId: string,
  mediaIds: string[] | undefined,
): Promise<AvariaPhotoUploadResult> {
  const result: AvariaPhotoUploadResult = {
    uploaded: 0,
    failed: 0,
    skipped: 0,
  };

  if (!mediaIds?.length) {
    return result;
  }

  for (const mediaId of mediaIds) {
    const attempt = await uploadSingleAvariaMedia(avariaId, mediaId);

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
