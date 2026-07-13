import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';

import { unblockChecklistOpsAfterRetomar } from './checklist-sync-impedimento';
import { recebimentoV2Db } from '../local-db/db';
import type { ProcessRecord } from '../local-db/schema';

const REMOTE_OVERRIDES_LOCAL_IMPEDIDO = new Set([
  'em_conferencia',
  'conferido',
  'finalizado',
]);

function resolveProcessStatusFromRemote(
  remoteSituacao: string,
  current?: ProcessRecord['status'],
): ProcessRecord['status'] | undefined {
  if (remoteSituacao === 'em_conferencia') {
    return 'working';
  }

  if (remoteSituacao === 'conferido' || remoteSituacao === 'finalizado') {
    return 'completed';
  }

  if (remoteSituacao === 'impedido') {
    return 'pendingSync';
  }

  if (remoteSituacao === 'liberado_para_conferencia' && current === 'pendingSync') {
    return 'ready';
  }

  return undefined;
}

async function hasUnsyncedLocalImpedimento(demandId: string): Promise<boolean> {
  const [pendingSuspender, impedimento] = await Promise.all([
    recebimentoV2Db.syncOperations
      .where('aggregateId')
      .equals(demandId)
      .and(
        (op) =>
          op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_SUSPENDER &&
          (op.status === 'pending' ||
            op.status === 'retry' ||
            op.status === 'blocked' ||
            op.status === 'rejected' ||
            op.status === 'conflict'),
      )
      .first(),
    recebimentoV2Db.impedimentos.where('demandId').equals(demandId).first(),
  ]);

  return (
    pendingSuspender != null ||
    (impedimento != null && impedimento.syncStatus !== 'synced')
  );
}

export async function shouldPreserveLocalImpedido(
  demandId: string,
  localSituacao: string | undefined,
  remoteSituacao: string,
): Promise<boolean> {
  if (localSituacao !== 'impedido' || remoteSituacao === 'impedido') {
    return false;
  }

  if (REMOTE_OVERRIDES_LOCAL_IMPEDIDO.has(remoteSituacao)) {
    return false;
  }

  return hasUnsyncedLocalImpedimento(demandId);
}

async function reconcileImpedimentoOpsAfterRemoteResume(
  demandId: string,
  now: number,
): Promise<void> {
  const ops = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .toArray();

  await Promise.all(
    ops
      .filter(
        (op) =>
          (op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_SUSPENDER ||
            op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_RETOMAR) &&
          (op.status === 'pending' ||
            op.status === 'retry' ||
            op.status === 'blocked' ||
            op.status === 'rejected'),
      )
      .map((op) =>
        recebimentoV2Db.syncOperations.update(op.id, {
          status: 'synced',
          errorMessage: undefined,
          updatedAt: now,
        }),
      ),
  );

  await unblockChecklistOpsAfterRetomar(demandId);
}

export type ReconcileRemoteSituacaoResult = {
  situacao: string;
  reconciled: boolean;
};

export async function reconcileRemoteSituacao(
  demandId: string,
  remoteSituacao: string,
  options?: { recebimentoId?: string | null },
): Promise<ReconcileRemoteSituacaoResult> {
  const now = Date.now();
  const [demand, process] = await Promise.all([
    recebimentoV2Db.demands.get(demandId),
    recebimentoV2Db.processes.get(demandId),
  ]);

  if (!demand) {
    return { situacao: remoteSituacao, reconciled: false };
  }

  const preserveLocalImpedido = await shouldPreserveLocalImpedido(
    demandId,
    demand.situacao,
    remoteSituacao,
  );

  if (preserveLocalImpedido) {
    return { situacao: demand.situacao, reconciled: false };
  }

  const nextSituacao = remoteSituacao;
  const wasLocalImpedido = demand.situacao === 'impedido';
  const resumedRemotely =
    wasLocalImpedido && REMOTE_OVERRIDES_LOCAL_IMPEDIDO.has(remoteSituacao);

  await recebimentoV2Db.demands.update(demandId, {
    situacao: nextSituacao,
    status: nextSituacao,
    updatedAt: now,
  });

  if (process) {
    const nextProcessStatus = resolveProcessStatusFromRemote(
      remoteSituacao,
      process.status,
    );

    await recebimentoV2Db.processes.update(demandId, {
      ...(nextProcessStatus ? { status: nextProcessStatus } : {}),
      errorMessage: undefined,
      updatedAt: now,
      ...(options?.recebimentoId ? { recebimentoId: options.recebimentoId } : {}),
    });
  }

  if (resumedRemotely) {
    await reconcileImpedimentoOpsAfterRemoteResume(demandId, now);
  }

  return { situacao: nextSituacao, reconciled: true };
}
