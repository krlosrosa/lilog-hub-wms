import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';

import { mapAvariaV2SyncPayload, isValidAvariaV2SyncPayload } from '../lib/map-avaria-v2-sync-payload';
import { mapConferenciaV2SyncPayload } from '../lib/map-conferencia-v2-sync-payload';
import { normalizeParametrosConferenciaV2 } from '../lib/parametros-conferencia';
import {
  resolveProdutoConferenciaV2,
  resolveProdutoIdForSkuV2,
  resolveProductForSkuV2,
  resolveUnidadesPorCaixa,
} from '../lib/resolve-produto-conferencia-v2';
import { recebimentoV2Db } from '../local-db/db';
import type { ConferenceRecord, DamageRecord, SyncOperationRecord } from '../local-db/schema';
import type { LoteModo } from '@/features/recebimento/types/recebimento.schema';

type ConferirOpPayload = {
  conferenceId?: string;
  serverItemId?: string;
  produtoId?: string;
  quantidadeRecebida?: number;
  unidadeMedida?: string;
  loteRecebido?: string;
};

type RemoveOpPayload = {
  conferenceId?: string;
  itemId?: string;
  sku?: string;
  lote?: string;
  deletedAt?: string;
};

function isValidConferirPayload(payload: Record<string, unknown>): boolean {
  return (
    typeof payload.produtoId === 'string' &&
    payload.produtoId.length > 0 &&
    typeof payload.quantidadeRecebida === 'number' &&
    Number.isFinite(payload.quantidadeRecebida) &&
    typeof payload.unidadeMedida === 'string' &&
    payload.unidadeMedida.length > 0
  );
}

function findServerItemIdForRemove(
  payload: RemoveOpPayload,
  ops: SyncOperationRecord[],
  conferences: ConferenceRecord[],
): string | undefined {
  const conferenceId = payload.conferenceId;
  if (conferenceId) {
    const conference = conferences.find((item) => item.id === conferenceId);
    if (conference?.serverItemId) {
      return conference.serverItemId;
    }

    const syncedConferir = ops.find(
      (op) =>
        op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR &&
        op.status === 'synced' &&
        (op.payload as ConferirOpPayload).conferenceId === conferenceId,
    );
    const fromConferir = (syncedConferir?.payload as ConferirOpPayload | undefined)
      ?.serverItemId;
    if (fromConferir) {
      return fromConferir;
    }
  }

  const lote = payload.lote?.trim();
  if (!lote) {
    return undefined;
  }

  for (const op of ops) {
    if (op.opType !== RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR || op.status !== 'synced') {
      continue;
    }
    const conferirPayload = op.payload as ConferirOpPayload;
    if (conferirPayload.loteRecebido === lote && conferirPayload.serverItemId) {
      return conferirPayload.serverItemId;
    }
  }

  return undefined;
}

async function rebuildConferirPayload(
  conference: ConferenceRecord,
  demandId: string,
): Promise<Record<string, unknown> | null> {
  const process = await recebimentoV2Db.processes.get(demandId);
  const unitConfig = process?.unidadeId
    ? await recebimentoV2Db.unitConfigs.get(process.unidadeId)
    : undefined;
  const parametros = normalizeParametrosConferenciaV2(unitConfig?.config);

  const product =
    (await resolveProductForSkuV2(demandId, conference.sku)) ??
    (await recebimentoV2Db.products
      .where('sku')
      .equals(conference.sku)
      .filter((item) => item.deletedAt === null)
      .first());

  if (!product) {
    return null;
  }

  const expectedItems = await recebimentoV2Db.expectedItems
    .where('demandId')
    .equals(demandId)
    .toArray();
  const expectedItem = expectedItems.find((item) => item.sku === conference.sku);
  const produtoConfig = resolveProdutoConferenciaV2(product, parametros);
  const produtoId = await resolveProdutoIdForSkuV2(demandId, conference.sku, product);
  const unidadesPorCaixa = resolveUnidadesPorCaixa(
    expectedItem?.unidadesPorCaixa,
    product.unidadesPorCaixa,
  );

  const syncPayload = mapConferenciaV2SyncPayload(
    conference,
    {
      produtoId,
      unidadesPorCaixa,
      pesoVariavel: produtoConfig.pesoVariavel,
      controlaLote: produtoConfig.controlaLote,
      controlaValidade: produtoConfig.controlaValidade,
      quantidadeModo: parametros.quantidadeModo,
      controlaPalete: parametros.controlaPalete,
    },
    parametros.loteModo as LoteModo,
  );

  return {
    conferenceId: conference.id,
    ...syncPayload,
  };
}

async function rebuildAvariaPayload(
  damage: DamageRecord,
  demandId: string,
): Promise<Record<string, unknown> | null> {
  const sku = damage.sku?.trim();
  const product = sku ? await resolveProductForSkuV2(demandId, sku) : null;
  const produtoId = sku
    ? await resolveProdutoIdForSkuV2(demandId, sku, product)
    : undefined;

  return mapAvariaV2SyncPayload(damage, produtoId);
}

export async function dismissSyncOperation(opId: string): Promise<void> {
  await recebimentoV2Db.syncOperations.delete(opId);
}

export async function repairSyncOperations(demandId: string): Promise<number> {
  const [ops, conferences, damages] = await Promise.all([
    recebimentoV2Db.syncOperations.where('aggregateId').equals(demandId).toArray(),
    recebimentoV2Db.conferences.where('demandId').equals(demandId).toArray(),
    recebimentoV2Db.damages.where('demandId').equals(demandId).toArray(),
  ]);

  const conferenceById = new Map(conferences.map((item) => [item.id, item]));
  const damageById = new Map(damages.map((item) => [item.id, item]));
  let changed = 0;
  const now = Date.now();

  for (const op of ops) {
    if (!op.opType?.trim()) {
      await recebimentoV2Db.syncOperations.delete(op.id);
      changed += 1;
      continue;
    }

    if (op.opType === RECEBIMENTO_V2_OP_TYPES.AVARIA_REMOVER) {
      const payload = (op.payload ?? {}) as { damageId?: string; avariaId?: string };
      const damage = payload.damageId ? damageById.get(payload.damageId) : undefined;

      if (!payload.avariaId?.trim() || !damage || damage.deletedAt == null) {
        await recebimentoV2Db.syncOperations.delete(op.id);
        changed += 1;
      }

      continue;
    }

    if (op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE) {
      if (op.status !== 'rejected' && op.status !== 'retry') {
        continue;
      }

      const payload = (op.payload ?? {}) as RemoveOpPayload;
      if (typeof payload.itemId === 'string' && payload.itemId.trim()) {
        if (op.status === 'rejected') {
          await recebimentoV2Db.syncOperations.update(op.id, {
            status: 'pending',
            errorMessage: undefined,
            updatedAt: now,
          });
          changed += 1;
        }
        continue;
      }

      const itemId = findServerItemIdForRemove(payload, ops, conferences);
      if (itemId) {
        await recebimentoV2Db.syncOperations.update(op.id, {
          status: 'pending',
          payload: { ...payload, itemId },
          errorMessage: undefined,
          updatedAt: now,
        });
        changed += 1;
        continue;
      }

      await recebimentoV2Db.syncOperations.delete(op.id);
      changed += 1;
      continue;
    }

    if (op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR) {
      if (op.status !== 'rejected' && op.status !== 'retry') {
        continue;
      }

      const payload = (op.payload ?? {}) as Record<string, unknown>;
      if (isValidConferirPayload(payload)) {
        if (op.status === 'rejected') {
          await recebimentoV2Db.syncOperations.update(op.id, {
            status: 'pending',
            errorMessage: undefined,
            updatedAt: now,
          });
          changed += 1;
        }
        continue;
      }

      const conferenceId = payload.conferenceId as string | undefined;
      const conference = conferenceId ? conferenceById.get(conferenceId) : undefined;
      if (!conference || conference.deletedAt != null) {
        await recebimentoV2Db.syncOperations.delete(op.id);
        changed += 1;
        continue;
      }

      const rebuilt = await rebuildConferirPayload(conference, demandId);
      if (!rebuilt) {
        await recebimentoV2Db.syncOperations.delete(op.id);
        changed += 1;
        continue;
      }

      await recebimentoV2Db.syncOperations.update(op.id, {
        status: 'pending',
        payload: rebuilt,
        errorMessage: undefined,
        updatedAt: now,
      });
      changed += 1;
    }
  }

  for (const op of ops) {
    if (op.opType !== RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR) {
      continue;
    }

    if (op.status !== 'rejected' && op.status !== 'retry') {
      continue;
    }

    const payload = (op.payload ?? {}) as Record<string, unknown>;
    const hasStaleReplicationPayload = payload.replicarParaTodos === true;

    if (
      isValidAvariaV2SyncPayload(payload) &&
      !hasStaleReplicationPayload &&
      op.status === 'rejected'
    ) {
      await recebimentoV2Db.syncOperations.update(op.id, {
        status: 'pending',
        errorMessage: undefined,
        updatedAt: now,
      });
      changed += 1;
      continue;
    }

    if (
      isValidAvariaV2SyncPayload(payload) &&
      !hasStaleReplicationPayload &&
      op.status !== 'rejected' &&
      op.status !== 'retry'
    ) {
      continue;
    }

    const damageId = payload.damageId as string | undefined;
    const damage = damageId ? damageById.get(damageId) : undefined;
    if (!damage || damage.deletedAt != null) {
      await recebimentoV2Db.syncOperations.delete(op.id);
      changed += 1;
      continue;
    }

    const rebuilt = await rebuildAvariaPayload(damage, demandId);
    if (!rebuilt) {
      await recebimentoV2Db.syncOperations.delete(op.id);
      changed += 1;
      continue;
    }

    await recebimentoV2Db.syncOperations.update(op.id, {
      status: 'pending',
      payload: rebuilt,
      errorMessage: undefined,
      updatedAt: now,
    });
    changed += 1;
  }

  return changed;
}
