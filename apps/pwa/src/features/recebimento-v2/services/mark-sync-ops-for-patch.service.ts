import {
  RECEBIMENTO_V2_OP_TYPES,
  type DemandPatchRequest,
  type DemandPatchResult,
} from '@lilog/contracts';

import { recebimentoV2Db } from '../local-db/db';
import type { SyncOperationRecord } from '../local-db/schema';

const CONFERENCE_OP_TYPES = new Set<string>([
  RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR,
  RECEBIMENTO_V2_OP_TYPES.ITEM_REMOVE_BY_PRODUTO,
  RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE,
  RECEBIMENTO_V2_OP_TYPES.PALETE_REMOVE,
  RECEBIMENTO_V2_OP_TYPES.PESAGEM_REMOVE,
]);

const AVARIA_OP_TYPES = new Set<string>([
  RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR,
  RECEBIMENTO_V2_OP_TYPES.AVARIA_REMOVER,
  RECEBIMENTO_V2_OP_TYPES.AVARIA_CLEAR,
]);

function isPendingOrRetry(status: string): boolean {
  return status === 'pending' || status === 'retry';
}

function hasSectionConflict(
  result: DemandPatchResult,
  section: string,
  clientId?: string,
): boolean {
  return (result.conflicts ?? []).some(
    (conflict) =>
      conflict.section === section &&
      (clientId == null || conflict.clientId === clientId),
  );
}

function getConferenceIdFromOpPayload(payload: unknown): string | undefined {
  const value = (payload as { conferenceId?: string }).conferenceId;
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function getDamageIdFromOpPayload(payload: unknown): string | undefined {
  const value = (payload as { damageId?: string }).damageId;
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function getImpedimentoIdFromOpPayload(payload: unknown): string | undefined {
  const value = (payload as { impedimentoId?: string }).impedimentoId;
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function getEtapaFromOpPayload(payload: unknown): string | undefined {
  const value = (payload as { etapa?: string }).etapa;
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function matchesConferenceOp(op: SyncOperationRecord, conferenceId: string): boolean {
  if (!CONFERENCE_OP_TYPES.has(op.opType)) {
    return false;
  }

  return getConferenceIdFromOpPayload(op.payload) === conferenceId;
}

function matchesAvariaOp(op: SyncOperationRecord, damageId: string): boolean {
  if (!AVARIA_OP_TYPES.has(op.opType)) {
    return false;
  }

  if (op.opType === RECEBIMENTO_V2_OP_TYPES.AVARIA_CLEAR) {
    return true;
  }

  return getDamageIdFromOpPayload(op.payload) === damageId;
}

async function markOpsSynced(opIds: Iterable<string>, now: number): Promise<void> {
  const ids = [...opIds];
  if (ids.length === 0) {
    return;
  }

  await recebimentoV2Db.syncOperations
    .where('id')
    .anyOf(ids)
    .modify((op) => {
      op.status = 'synced';
      op.errorMessage = undefined;
      op.nextAttemptAt = undefined;
      op.updatedAt = now;
    });
}

export async function markLegacySyncOpsForAppliedPatch(
  demandId: string,
  request: DemandPatchRequest,
  result: DemandPatchResult,
  now: number,
): Promise<void> {
  const pendingOps = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .filter((op) => isPendingOrRetry(op.status))
    .toArray();

  if (pendingOps.length === 0) {
    return;
  }

  const opIdsToSync = new Set<string>();

  if (
    result.applied.checklist &&
    request.patch.checklist &&
    !hasSectionConflict(result, 'checklist', request.patch.checklist.clientChecklistId)
  ) {
    for (const op of pendingOps) {
      if (op.opType === RECEBIMENTO_V2_OP_TYPES.CHECKLIST_UPSERT) {
        opIdsToSync.add(op.id);
      }
    }
  }

  if (request.patch.conferencias?.length) {
    const conferenciasApplied = result.applied.conferencias?.accepted ?? 0;
    if (conferenciasApplied > 0) {
      for (const item of request.patch.conferencias) {
        if (hasSectionConflict(result, 'conferencias', item.clientConferenceId)) {
          continue;
        }

        for (const op of pendingOps) {
          if (matchesConferenceOp(op, item.clientConferenceId)) {
            opIdsToSync.add(op.id);
          }
        }
      }
    }
  }

  if (request.patch.avarias?.length) {
    const avariasApplied = result.applied.avarias?.accepted ?? 0;
    if (avariasApplied > 0) {
      for (const item of request.patch.avarias) {
        if (hasSectionConflict(result, 'avarias', item.clientDamageId)) {
          continue;
        }

        for (const op of pendingOps) {
          if (matchesAvariaOp(op, item.clientDamageId)) {
            opIdsToSync.add(op.id);
          }
        }
      }
    }
  }

  if (request.patch.temperaturas?.length && result.applied.temperaturas?.accepted) {
    for (const item of request.patch.temperaturas) {
      if (hasSectionConflict(result, 'temperaturas', item.etapa)) {
        continue;
      }

      for (const op of pendingOps) {
        if (
          op.opType === RECEBIMENTO_V2_OP_TYPES.TEMPERATURA_UPSERT &&
          getEtapaFromOpPayload(op.payload) === item.etapa
        ) {
          opIdsToSync.add(op.id);
        }
      }
    }
  }

  if (
    result.applied.impedimento &&
    request.patch.impedimento &&
    !request.patch.impedimento.retomar &&
    !hasSectionConflict(result, 'impedimento', request.patch.impedimento.clientImpedimentoId)
  ) {
    for (const op of pendingOps) {
      if (op.opType !== RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_SUSPENDER) {
        continue;
      }

      const impedimentoId = getImpedimentoIdFromOpPayload(op.payload);
      if (
        impedimentoId == null ||
        impedimentoId === request.patch.impedimento.clientImpedimentoId
      ) {
        opIdsToSync.add(op.id);
      }
    }
  }

  await markOpsSynced(opIdsToSync, now);
}

export async function reconcileOrphanedPendingSyncOps(demandId: string): Promise<number> {
  const now = Date.now();
  const ops = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .filter((op) => isPendingOrRetry(op.status))
    .toArray();

  if (ops.length === 0) {
    return 0;
  }

  const toSync: string[] = [];

  for (const op of ops) {
    if (await isOrphanedPendingOp(op, demandId)) {
      toSync.push(op.id);
    }
  }

  await markOpsSynced(toSync, now);
  return toSync.length;
}

async function isOrphanedPendingOp(
  op: SyncOperationRecord,
  demandId: string,
): Promise<boolean> {
  if (op.opType === RECEBIMENTO_V2_OP_TYPES.CHECKLIST_UPSERT) {
    const checklist = await recebimentoV2Db.checklists.get(demandId);
    return checklist?.syncStatus === 'synced';
  }

  if (CONFERENCE_OP_TYPES.has(op.opType)) {
    const conferenceId = getConferenceIdFromOpPayload(op.payload);
    if (!conferenceId) {
      return false;
    }

    const conference = await recebimentoV2Db.conferences.get(conferenceId);
    return conference?.syncStatus === 'synced' || conference?.deletedAt != null;
  }

  if (op.opType === RECEBIMENTO_V2_OP_TYPES.TEMPERATURA_UPSERT) {
    const etapa = getEtapaFromOpPayload(op.payload);
    if (!etapa) {
      return false;
    }

    const temperature = await recebimentoV2Db.temperatures.get(`${demandId}::${etapa}`);
    return temperature?.syncStatus === 'synced';
  }

  if (AVARIA_OP_TYPES.has(op.opType)) {
    if (op.opType === RECEBIMENTO_V2_OP_TYPES.AVARIA_CLEAR) {
      const dirtyDamages = await recebimentoV2Db.damages
        .where('demandId')
        .equals(demandId)
        .filter((record) => record.syncStatus !== 'synced' && record.deletedAt == null)
        .count();
      return dirtyDamages === 0;
    }

    const damageId = getDamageIdFromOpPayload(op.payload);
    if (!damageId) {
      return true;
    }

    const damage = await recebimentoV2Db.damages.get(damageId);
    if (!damage) {
      return true;
    }

    return damage.syncStatus === 'synced' || damage.deletedAt != null;
  }

  if (op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_SUSPENDER) {
    const impedimentoId = getImpedimentoIdFromOpPayload(op.payload);
    if (!impedimentoId) {
      return false;
    }

    const impedimento = await recebimentoV2Db.impedimentos.get(impedimentoId);
    return impedimento?.syncStatus === 'synced';
  }

  if (op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_ENCERRAR) {
    const process = await recebimentoV2Db.processes.get(demandId);
    return process?.pendingFinalizationSync !== true && process?.status === 'completed';
  }

  if (op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_RETOMAR) {
    const process = await recebimentoV2Db.processes.get(demandId);
    return process?.status !== 'pendingSync';
  }

  return false;
}
