import type { Demand } from '@/features/recebimento/types/recebimento.schema';

function isServerBehindLocal(remote: Demand, local: Demand): boolean {
  const localChecklistDone =
    local.preRecebimentoSituacao === 'em_conferencia' ||
    local.preRecebimentoSituacao === 'conferido';
  const serverStillLiberado =
    remote.preRecebimentoSituacao === 'liberado_para_conferencia' ||
    remote.status === 'liberado_para_conferencia';

  return localChecklistDone && serverStillLiberado;
}

export function mergeRemoteDemandWithLocal(
  remote: Demand,
  local: Demand | undefined,
  hasPendingOutbox: boolean,
): Demand {
  if (!local && !hasPendingOutbox) {
    return remote;
  }

  const shouldPreserveLocal =
    local?.pendingOfflineSync === true ||
    hasPendingOutbox ||
    (local ? isServerBehindLocal(remote, local) : false);

  if (!shouldPreserveLocal) {
    return remote;
  }

  return {
    ...remote,
    status: local?.status ?? remote.status,
    statusLabel: local?.statusLabel ?? remote.statusLabel,
    preRecebimentoSituacao:
      local?.preRecebimentoSituacao ?? remote.preRecebimentoSituacao,
    recebimentoId: local?.recebimentoId ?? remote.recebimentoId,
    pendingOfflineSync: local?.pendingOfflineSync ?? hasPendingOutbox,
    dock: local?.dock || remote.dock,
  };
}
