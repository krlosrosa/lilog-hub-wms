import { clearConferenciaSessionData } from '@/features/recebimento/lib/conferencia-context-store';

import { db } from './db';

function matchesDemandEndpoint(
  endpoint: string,
  demandId: string,
  routeId?: string,
): boolean {
  const encodedDemandId = encodeURIComponent(demandId);
  if (endpoint.includes(encodedDemandId)) return true;
  if (routeId && routeId !== demandId) {
    return endpoint.includes(encodeURIComponent(routeId));
  }
  return false;
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
      db.devolucaoDemands,
      db.inventoryDemands,
      db.demandContexts,
      db.checklistDrafts,
      db.demandProdutos,
      db.photos,
      db.outbox,
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

      const allOutbox = await db.outbox.toArray();
      const outboxIds = allOutbox
        .filter((entry) =>
          [...ids].some((id) => matchesDemandEndpoint(entry.endpoint, id)),
        )
        .map((entry) => entry.id!)
        .filter((id) => id != null);

      if (outboxIds.length > 0) {
        await db.outbox.bulkDelete(outboxIds);
      }
    },
  );

  for (const id of ids) {
    clearConferenciaSessionData(id);
  }
}
