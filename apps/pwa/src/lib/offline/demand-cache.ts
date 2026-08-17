import { clearConferenciaSessionData } from '@/features/recebimento/lib/conferencia-context-store';
import { resolveAvariaCacheKey } from '@/lib/offline/avaria-cache';
import { deleteChecklistDraft } from '@/lib/offline/checklist-cache';

import { db } from './db';

export async function clearRecebimentoDemandAfterSync(
  demandId: string,
  routeId?: string,
): Promise<void> {
  await db.recebimentoConferenciaRascunho.where('demandId').equals(demandId).delete();
  await deleteChecklistDraft(demandId);
  await db.recebimentoAvarias.delete(resolveAvariaCacheKey(demandId, null));
  await clearDemandCache(demandId, routeId);
}

export async function clearDemandCache(
  demandId: string,
  routeId?: string,
): Promise<void> {
  const ids = new Set([demandId, routeId].filter(Boolean) as string[]);

  await db.transaction(
    'rw',
    [
      db.demands,
      db.demandContexts,
      db.checklistDrafts,
      db.demandProdutos,
      db.photos,
    ],
    async () => {
      const allPhotos = await db.photos.toArray();

      for (const id of ids) {
        await db.demands.where('id').equals(id).delete();
        await db.demands.where('routeId').equals(id).delete();
        await db.demandContexts.where('demandId').equals(id).delete();
        await db.checklistDrafts.where('demandId').equals(id).delete();
        await db.demandProdutos.where('demandId').equals(id).delete();

        const photoIds = allPhotos
          .filter(
            (photo) =>
              photo.relatedId === id ||
              photo.relatedId.startsWith(`checklist-${id}-`),
          )
          .map((photo) => photo.id!)
          .filter((photoId) => photoId != null);

        if (photoIds.length > 0) {
          await db.photos.bulkDelete(photoIds);
        }
      }
    },
  );

  for (const id of ids) {
    clearConferenciaSessionData(id);
  }
}
