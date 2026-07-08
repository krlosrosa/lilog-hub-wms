import { db } from '@/lib/offline/db';
import { uploadDocumentToBucket } from '@/lib/offline/document-upload';
import { deletePhotos, getPhoto } from '@/lib/offline/photo-store';

export type ChecklistPhotoSlotUpload = {
  slotId: string;
  photoIds: number[];
};

export async function uploadDevolucaoChecklistPhotos(
  demandaId: string,
  slots: ChecklistPhotoSlotUpload[],
): Promise<number> {
  const allIds = slots.flatMap((slot) => slot.photoIds);
  if (allIds.length === 0) {
    return 0;
  }

  let uploaded = 0;

  for (const slot of slots) {
    for (const photoId of slot.photoIds) {
      const photo = await getPhoto(db, photoId);
      if (!photo) continue;

      await uploadDocumentToBucket(photo, {
        nome: `checklist-${slot.slotId}-${photoId}.jpg`,
        entidadeTipo: 'checklist_devolucao',
        entidadeId: demandaId,
      });
      uploaded += 1;
    }
  }

  await deletePhotos(db, allIds);
  return uploaded;
}
