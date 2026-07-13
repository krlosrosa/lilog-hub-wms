import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';

import { mapAvariaRemoverV2SyncPayload } from '../lib/map-avaria-v2-sync-payload';
import { normalizeSkuParam } from '../lib/resolve-produto-conferencia-v2';
import { recebimentoV2Db } from '../local-db/db';
import type { DamageRecord, SyncOperationRecord } from '../local-db/schema';
import { triggerAutoSyncIfPending } from './auto-sync-v2.service';
import { deleteConferenceRecord } from './conference-sync.actions';

function matchesSku(a: string | undefined, normalizedSku: string): boolean {
  if (!a?.trim()) return false;
  return normalizeSkuParam(a).toUpperCase() === normalizedSku;
}

async function removeDamageRecord(
  demandId: string,
  damage: DamageRecord,
): Promise<boolean> {
  const now = new Date().toISOString();
  const nowMs = Date.now();

  const removeSyncOp: SyncOperationRecord | null = damage.serverAvariaId
    ? {
        id: crypto.randomUUID(),
        aggregateId: demandId,
        module: 'damage',
        opType: RECEBIMENTO_V2_OP_TYPES.AVARIA_REMOVER,
        sequence: nowMs,
        dependsOn: [],
        idempotencyKey: crypto.randomUUID(),
        payload: mapAvariaRemoverV2SyncPayload(damage.id, damage.serverAvariaId),
        attachmentIds: [],
        status: 'pending',
        attempts: 0,
        createdAt: nowMs,
        updatedAt: nowMs,
      }
    : null;

  await recebimentoV2Db.transaction(
    'rw',
    [recebimentoV2Db.damages, recebimentoV2Db.syncOperations, recebimentoV2Db.media],
    async () => {
      await recebimentoV2Db.damages.update(damage.id, {
        deletedAt: now,
        syncStatus: removeSyncOp ? 'pending' : 'synced',
        updatedAt: nowMs,
      });

      const pendingOps = await recebimentoV2Db.syncOperations
        .where('aggregateId')
        .equals(demandId)
        .and(
          (op) =>
            (op.opType === RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR ||
              op.opType === RECEBIMENTO_V2_OP_TYPES.AVARIA_REMOVER) &&
            (op.status === 'pending' || op.status === 'retry'),
        )
        .toArray();

      for (const op of pendingOps) {
        const payload = op.payload as { damageId?: string };
        if (payload.damageId === damage.id) {
          await recebimentoV2Db.syncOperations.delete(op.id);
        }
      }

      if (removeSyncOp) {
        await recebimentoV2Db.syncOperations.put(removeSyncOp);
      }

      if (damage.mediaIds?.length) {
        await recebimentoV2Db.media.bulkDelete(damage.mediaIds);
      }
    },
  );

  return removeSyncOp != null;
}

export async function removeAddedItemV2(demandId: string, sku: string): Promise<void> {
  const normalizedSku = normalizeSkuParam(sku).toUpperCase();
  if (!normalizedSku) {
    throw new Error('SKU inválido');
  }

  const expectedItems = await recebimentoV2Db.expectedItems
    .where('demandId')
    .equals(demandId)
    .toArray();

  const addedItems = expectedItems.filter(
    (item) => item.isNovo === true && matchesSku(item.sku, normalizedSku),
  );

  if (addedItems.length === 0) {
    throw new Error('Este item não pode ser excluído');
  }

  const conferences = await recebimentoV2Db.conferences
    .where('demandId')
    .equals(demandId)
    .toArray();

  const skuConferences = conferences.filter(
    (entry) => entry.deletedAt == null && matchesSku(entry.sku, normalizedSku),
  );

  let needsSync = false;

  for (const conference of skuConferences) {
    const enqueued = await deleteConferenceRecord(conference.id);
    if (enqueued) {
      needsSync = true;
    }
  }

  const damages = await recebimentoV2Db.damages
    .where('demandId')
    .equals(demandId)
    .and((damage) => !damage.deletedAt && matchesSku(damage.sku, normalizedSku))
    .toArray();

  for (const damage of damages) {
    const enqueued = await removeDamageRecord(demandId, damage);
    if (enqueued) {
      needsSync = true;
    }
  }

  await recebimentoV2Db.transaction('rw', [recebimentoV2Db.expectedItems], async () => {
    for (const item of addedItems) {
      await recebimentoV2Db.expectedItems.delete(item.id);
    }
  });

  if (needsSync) {
    triggerAutoSyncIfPending(demandId);
  }
}
