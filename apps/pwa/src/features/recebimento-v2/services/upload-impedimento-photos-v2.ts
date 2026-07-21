import { uppyBucketUpload } from '@/lib/uppy/uppy-bucket-upload';

import { recebimentoV2Db } from '../local-db/db';

const IMPEDIMENTO_ENTIDADE_TIPO = 'impedimento_recebimento';

export interface ImpedimentoPhotoUploadResult {
  uploaded: number;
  failed: number;
  skipped: number;
}

/**
 * Uploads impedimento evidence photos from local IndexedDB media to document storage.
 */
export async function uploadImpedimentoPhotosV2(
  preRecebimentoId: string,
  mediaIds: string[] | undefined,
): Promise<ImpedimentoPhotoUploadResult> {
  if (!mediaIds?.length) {
    return { uploaded: 0, failed: 0, skipped: 0 };
  }

  const records = (await recebimentoV2Db.media.bulkGet(mediaIds)).filter(
    (record): record is NonNullable<typeof record> => record != null,
  );

  return uppyBucketUpload(records, {
    entidadeTipo: IMPEDIMENTO_ENTIDADE_TIPO,
    entidadeId: preRecebimentoId,
    sessionLabel: `Upload impedimento ${preRecebimentoId.slice(0, 8)}`,
    nome: (record) => `impedimento-${record.id}.jpg`,
  });
}
