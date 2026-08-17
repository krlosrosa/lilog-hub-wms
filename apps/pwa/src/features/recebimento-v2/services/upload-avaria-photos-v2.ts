import { pushPhotoDebugEntry } from '@/lib/images/photo-debug-store';
import { uppyBucketUpload } from '@/lib/uppy/uppy-bucket-upload';

import { debugRecebimentoV2 } from '../lib/sync-debug';
import { recebimentoV2Db } from '../local-db/db';

const AVARIA_ENTIDADE_TIPO = 'recebimento_avaria';

export interface AvariaPhotoUploadResult {
  uploaded: number;
  failed: number;
  skipped: number;
}

function logAvariaPhotoUpload(
  event: string,
  summary: string,
  detail: Record<string, unknown>,
): void {
  debugRecebimentoV2('photo-upload', event, detail);
  pushPhotoDebugEntry({
    event: `avaria/${event}`,
    summary,
    detail: JSON.stringify(detail, null, 2),
  });
}

/**
 * Uploads avaria evidence photos from local IndexedDB media to document storage.
 * Skips media already marked as uploaded. Does not throw on individual failures.
 */
export async function uploadAvariaPhotosV2(
  avariaId: string,
  mediaIds: string[] | undefined,
): Promise<AvariaPhotoUploadResult> {
  if (!mediaIds?.length) {
    logAvariaPhotoUpload('batch-skip', 'Nenhuma mediaId informada', { avariaId });
    return { uploaded: 0, failed: 0, skipped: 0 };
  }

  logAvariaPhotoUpload('batch-start', `Upload de ${mediaIds.length} foto(s)`, {
    avariaId,
    mediaIds,
  });

  const records = (await recebimentoV2Db.media.bulkGet(mediaIds)).filter(
    (record): record is NonNullable<typeof record> => record != null,
  );

  const result = await uppyBucketUpload(records, {
    entidadeTipo: AVARIA_ENTIDADE_TIPO,
    entidadeId: avariaId,
    sessionLabel: `Upload avaria ${avariaId.slice(0, 8)}`,
    nome: (record) => `avaria-${record.id}.jpg`,
  });

  logAvariaPhotoUpload('batch-end', 'Upload batch finalizado', {
    avariaId,
    ...result,
  });

  return result;
}
