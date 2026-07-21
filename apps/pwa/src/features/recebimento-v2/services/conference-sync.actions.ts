import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';

import { normalizeSkuParam } from '../lib/resolve-produto-conferencia-v2.js';
import { deriveLifecycleFromStatus } from '../lib/sync-operation-lifecycle.js';
import { recebimentoV2Db } from '../local-db/db.js';
import type { ConferenceRecord, SyncOperationRecord } from '../local-db/schema.js';

type ConferirOpPayload = {
  conferenceId?: string;
  serverItemId?: string;
  serverPesagemId?: string;
  pesoVariavel?: boolean;
};

type RemoveOpPayload = {
  conferenceId?: string;
  itemId?: string;
  pesagemId?: string;
  deletedAt?: string;
};

function isPvarConference(conference: ConferenceRecord): boolean {
  return (
    conference.isPvarBox === true ||
    (conference.peso != null && conference.peso > 0 && conference.recebidaCaixa === 1)
  );
}

async function resolveServerPesagemIdForDelete(
  conference: ConferenceRecord,
): Promise<string | undefined> {
  if (conference.serverPesagemId?.trim()) {
    return conference.serverPesagemId;
  }

  const ops = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(conference.demandId)
    .toArray();

  const syncedConferir = ops.find(
    (op) =>
      op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR &&
      op.status === 'synced' &&
      (op.payload as ConferirOpPayload).conferenceId === conference.id,
  );

  const fromConferirPayload = (syncedConferir?.payload as ConferirOpPayload | undefined)
    ?.serverPesagemId;
  if (fromConferirPayload?.trim()) {
    return fromConferirPayload;
  }

  return undefined;
}

async function resolveServerItemIdForDelete(
  conference: ConferenceRecord,
): Promise<string | undefined> {
  if (conference.serverItemId?.trim()) {
    return conference.serverItemId;
  }

  const ops = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(conference.demandId)
    .toArray();

  const syncedConferir = ops.find(
    (op) =>
      op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR &&
      op.status === 'synced' &&
      (op.payload as ConferirOpPayload).conferenceId === conference.id,
  );

  const fromConferirPayload = (syncedConferir?.payload as ConferirOpPayload | undefined)
    ?.serverItemId;
  if (fromConferirPayload?.trim()) {
    return fromConferirPayload;
  }

  if (conference.syncStatus === 'synced' && !isPvarConference(conference)) {
    return conference.id;
  }

  return undefined;
}

async function countRemainingPvarBoxes(
  conference: ConferenceRecord,
  excludeConferenceId: string,
): Promise<number> {
  const normalizedSku = normalizeSkuParam(conference.sku).toUpperCase();
  const conferences = await recebimentoV2Db.conferences
    .where('demandId')
    .equals(conference.demandId)
    .toArray();

  return conferences.filter(
    (entry) =>
      entry.id !== excludeConferenceId &&
      entry.deletedAt == null &&
      isPvarConference(entry) &&
      normalizeSkuParam(entry.sku).toUpperCase() === normalizedSku,
  ).length;
}

export async function deleteConferenceRecord(conferenceId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const nowMs = Date.now();

  const conference = await recebimentoV2Db.conferences.get(conferenceId);
  if (!conference) return false;

  const demandOps = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(conference.demandId)
    .toArray();

  const pendingConferirOps = demandOps.filter(
    (op) =>
      op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR &&
      (op.status === 'pending' || op.status === 'retry') &&
      (op.payload as ConferirOpPayload).conferenceId === conferenceId,
  );

  const staleRemoveOps = demandOps.filter(
    (op) =>
      (op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE ||
        op.opType === RECEBIMENTO_V2_OP_TYPES.PESAGEM_REMOVE) &&
      (op.status === 'rejected' || op.status === 'retry') &&
      (op.payload as RemoveOpPayload).conferenceId === conferenceId,
  );

  const isPvar = isPvarConference(conference);
  const serverPesagemId = isPvar ? await resolveServerPesagemIdForDelete(conference) : undefined;
  const serverItemId = await resolveServerItemIdForDelete(conference);

  let removeSyncOp: SyncOperationRecord | null = null;

  if (isPvar && serverPesagemId) {
    removeSyncOp = {
      id: crypto.randomUUID(),
      aggregateId: conference.demandId,
      module: 'conference',
      opType: RECEBIMENTO_V2_OP_TYPES.PESAGEM_REMOVE,
      sequence: nowMs,
      dependsOn: [],
      idempotencyKey: crypto.randomUUID(),
      payload: {
        pesagemId: serverPesagemId,
        conferenceId,
        sku: conference.sku,
        deletedAt: now,
      },
      attachmentIds: [],
      status: 'pending',
      lifecycleStatus: deriveLifecycleFromStatus('pending'),
      attempts: 0,
      createdAt: nowMs,
      updatedAt: nowMs,
    };
  } else if (isPvar && serverItemId) {
    const remainingBoxes = await countRemainingPvarBoxes(conference, conferenceId);
    if (remainingBoxes === 0) {
      removeSyncOp = {
        id: crypto.randomUUID(),
        aggregateId: conference.demandId,
        module: 'conference',
        opType: RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE,
        sequence: nowMs,
        dependsOn: [],
        idempotencyKey: crypto.randomUUID(),
        payload: {
          itemId: serverItemId,
          conferenceId,
          deletedAt: now,
          sku: conference.sku,
          lote: conference.lote,
        },
        attachmentIds: [],
        status: 'pending',
        lifecycleStatus: deriveLifecycleFromStatus('pending'),
        attempts: 0,
        createdAt: nowMs,
        updatedAt: nowMs,
      };
    }
  } else if (serverItemId) {
    removeSyncOp = {
      id: crypto.randomUUID(),
      aggregateId: conference.demandId,
      module: 'conference',
      opType: RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE,
      sequence: nowMs,
      dependsOn: [],
      idempotencyKey: crypto.randomUUID(),
      payload: {
        itemId: serverItemId,
        conferenceId,
        deletedAt: now,
        sku: conference.sku,
        lote: conference.lote,
      },
      attachmentIds: [],
      status: 'pending',
      lifecycleStatus: deriveLifecycleFromStatus('pending'),
      attempts: 0,
      createdAt: nowMs,
      updatedAt: nowMs,
    };
  }

  await recebimentoV2Db.transaction(
    'rw',
    [recebimentoV2Db.conferences, recebimentoV2Db.syncOperations],
    async () => {
      await recebimentoV2Db.conferences.delete(conferenceId);

      for (const op of pendingConferirOps) {
        await recebimentoV2Db.syncOperations.update(op.id, {
          status: 'rejected',
          lifecycleStatus: 'CANCELLED',
          errorMessage: 'Operação cancelada por exclusão local antes do envio',
          updatedAt: nowMs,
        });
      }

      for (const op of staleRemoveOps) {
        await recebimentoV2Db.syncOperations.delete(op.id);
      }

      if (removeSyncOp) {
        await recebimentoV2Db.syncOperations.put(removeSyncOp);
      }
    },
  );

  return removeSyncOp != null;
}
