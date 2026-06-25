import { db } from '@/lib/offline/db';
import { uploadDocumentToBucket } from '@/lib/offline/document-upload';
import { deletePhotos, getPhoto } from '@/lib/offline/photo-store';

export async function uploadAvariaPhotos(
  recebimentoId: string,
  photoIds: number[],
): Promise<number> {
  if (photoIds.length === 0) {
    return 0;
  }

  let uploaded = 0;

  for (const photoId of photoIds) {
    const photo = await getPhoto(db, photoId);
    if (!photo) continue;

    await uploadDocumentToBucket(photo, {
      nome: `avaria-${photoId}.jpg`,
      entidadeTipo: 'recebimento_avaria',
      entidadeId: recebimentoId,
    });
    uploaded += 1;
  }

  await deletePhotos(db, photoIds);
  return uploaded;
}
