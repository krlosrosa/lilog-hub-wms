import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';

import { recebimentoV2Db } from '../local-db/db';
import { getImpedimentoSyncState } from './impedimento-sync-state';
import { assertTemperaturasBauCompletas } from './temperatura-bau-v2';

const BLOCKING_OP_STATUSES = new Set(['rejected', 'conflict']);

const ACTIVE_ENCERRAR_STATUSES = new Set(['pending', 'retry', 'syncing']);

const STALE_ENCERRAR_STATUSES = new Set(['rejected', 'conflict']);

export async function clearStaleEncerrarOps(demandId: string): Promise<void> {
  const staleOps = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .and(
      (op) =>
        op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_ENCERRAR &&
        STALE_ENCERRAR_STATUSES.has(op.status),
    )
    .toArray();

  if (staleOps.length === 0) {
    return;
  }

  await recebimentoV2Db.syncOperations.bulkDelete(staleOps.map((op) => op.id));
}

export async function hasActiveEncerrarOp(demandId: string): Promise<boolean> {
  const activeOps = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .and(
      (op) =>
        op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_ENCERRAR &&
        ACTIVE_ENCERRAR_STATUSES.has(op.status),
    )
    .count();

  return activeOps > 0;
}

export async function assertCanFinalizeConferencia(
  demandId: string,
): Promise<void> {
  const impedimentoState = await getImpedimentoSyncState(demandId);

  if (impedimentoState.hasImpedimento && !impedimentoState.isSyncedOnServer) {
    throw new Error(
      impedimentoState.blockingMessage ??
        'O impedimento ainda não foi enviado ao servidor. Sincronize antes de encerrar.',
    );
  }

  const [process, ops] = await Promise.all([
    recebimentoV2Db.processes.get(demandId),
    recebimentoV2Db.syncOperations
      .where('aggregateId')
      .equals(demandId)
      .toArray(),
  ]);

  const blockingOps = ops.filter((op) => BLOCKING_OP_STATUSES.has(op.status));
  if (blockingOps.length > 0) {
    const hasRejected = blockingOps.some((op) => op.status === 'rejected');
    const hasConflict = blockingOps.some((op) => op.status === 'conflict');
    throw new Error(
      hasRejected
        ? 'Existem operações rejeitadas na sincronização. Resolva antes de encerrar a conferência.'
        : hasConflict
          ? 'Existem conflitos de sincronização. Resolva antes de encerrar a conferência.'
          : 'Existem operações com falha na sincronização. Resolva antes de encerrar a conferência.',
    );
  }

  if (!process?.recebimentoId) {
    throw new Error(
      'A conferência ainda não foi iniciada no servidor. Aguarde a sincronização do checklist e tente novamente.',
    );
  }

  await assertTemperaturasBauCompletas(demandId);
}
