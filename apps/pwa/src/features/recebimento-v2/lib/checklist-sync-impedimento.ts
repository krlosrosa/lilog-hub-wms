import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';

import { recebimentoV2Db } from '../local-db/db';

export const CHECKLIST_BLOCKED_DURING_IMPEDIMENTO_MSG =
  'Checklist aguardando retomada da conferência após impedimento.';

const CHECKLIST_OP_STATUSES_TO_BLOCK = new Set(['pending', 'retry']);

async function listChecklistOpsToBlock(demandId: string) {
  return recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .and(
      (op) =>
        op.opType === RECEBIMENTO_V2_OP_TYPES.CHECKLIST_UPSERT &&
        CHECKLIST_OP_STATUSES_TO_BLOCK.has(op.status),
    )
    .toArray();
}

export async function blockChecklistOpsDuringImpedimento(
  demandId: string,
): Promise<number> {
  const ops = await listChecklistOpsToBlock(demandId);
  if (ops.length === 0) {
    return 0;
  }

  const now = Date.now();
  await Promise.all(
    ops.map((op) =>
      recebimentoV2Db.syncOperations.update(op.id, {
        status: 'blocked',
        errorMessage: CHECKLIST_BLOCKED_DURING_IMPEDIMENTO_MSG,
        updatedAt: now,
      }),
    ),
  );

  return ops.length;
}

export async function unblockChecklistOpsAfterRetomar(
  demandId: string,
): Promise<number> {
  const ops = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .and(
      (op) =>
        op.opType === RECEBIMENTO_V2_OP_TYPES.CHECKLIST_UPSERT && op.status === 'blocked',
    )
    .toArray();

  if (ops.length === 0) {
    return 0;
  }

  const now = Date.now();
  await Promise.all(
    ops.map((op) =>
      recebimentoV2Db.syncOperations.update(op.id, {
        status: 'pending',
        errorMessage: undefined,
        updatedAt: now,
      }),
    ),
  );

  return ops.length;
}
