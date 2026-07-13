import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';

import { recebimentoV2Db } from '../local-db/db';
import type { ImpedimentoRecord, SyncOperationRecord } from '../local-db/schema';

export type ImpedimentoSyncState = {
  hasImpedimento: boolean;
  isSyncedOnServer: boolean;
  canRetomar: boolean;
  hasPendingSuspender: boolean;
  hasFailedSuspender: boolean;
  blockingMessage: string | null;
  suspenderErrorMessage: string | null;
};

async function findSuspenderOp(
  demandId: string,
): Promise<SyncOperationRecord | undefined> {
  const ops = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .and((op) => op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_SUSPENDER)
    .toArray();

  if (ops.length === 0) {
    return undefined;
  }

  return ops.sort((a, b) => b.createdAt - a.createdAt)[0];
}

function isSuspenderSynced(
  impedimento: ImpedimentoRecord | undefined,
  suspenderOp: SyncOperationRecord | undefined,
): boolean {
  if (suspenderOp?.status === 'synced') {
    return true;
  }

  return (
    impedimento?.syncStatus === 'synced' &&
    Boolean(impedimento.serverImpedimentoId)
  );
}

export async function getImpedimentoSyncState(
  demandId: string,
): Promise<ImpedimentoSyncState> {
  const [impedimento, suspenderOp] = await Promise.all([
    recebimentoV2Db.impedimentos.where('demandId').equals(demandId).first(),
    findSuspenderOp(demandId),
  ]);

  if (!impedimento) {
    return {
      hasImpedimento: false,
      isSyncedOnServer: false,
      canRetomar: false,
      hasPendingSuspender: false,
      hasFailedSuspender: false,
      blockingMessage: null,
      suspenderErrorMessage: null,
    };
  }

  const hasPendingSuspender =
    suspenderOp != null &&
    (suspenderOp.status === 'pending' ||
      suspenderOp.status === 'retry' ||
      suspenderOp.status === 'syncing');

  const hasFailedSuspender =
    suspenderOp?.status === 'rejected' || suspenderOp?.status === 'conflict';

  const isSyncedOnServer = isSuspenderSynced(impedimento, suspenderOp);

  let blockingMessage: string | null = null;

  if (hasFailedSuspender) {
    blockingMessage =
      suspenderOp?.errorMessage ??
      'Falha ao enviar o impedimento. Abra a sincronização e tente novamente antes de retomar.';
  } else if (hasPendingSuspender || impedimento.syncStatus === 'pending') {
    blockingMessage =
      'Aguardando envio do impedimento ao servidor. Sincronize antes de retomar a conferência.';
  } else if (!isSyncedOnServer) {
    blockingMessage =
      'Impedimento ainda não foi confirmado no servidor. Sincronize antes de retomar.';
  }

  const canRetomar =
    isSyncedOnServer && !hasPendingSuspender && !hasFailedSuspender;

  return {
    hasImpedimento: true,
    isSyncedOnServer,
    canRetomar,
    hasPendingSuspender,
    hasFailedSuspender,
    blockingMessage,
    suspenderErrorMessage: suspenderOp?.errorMessage ?? null,
  };
}

export function formatImpedimentoListaBadge(input: {
  isImpedido: boolean;
  syncState: ImpedimentoSyncState | null | undefined;
}): string {
  if (!input.isImpedido) {
    return 'Impedido';
  }

  if (!input.syncState?.hasImpedimento) {
    return 'Impedido';
  }

  if (input.syncState.hasFailedSuspender) {
    return 'Impedido · falha sync';
  }

  if (input.syncState.hasPendingSuspender || !input.syncState.isSyncedOnServer) {
    return 'Impedido · enviando';
  }

  return 'Impedido';
}
