import { getDemanda, listDemandas } from '@lilog/replicache-recebimento';
import type { RecebimentoReplicache } from '@lilog/replicache-recebimento';

import { fetchOperadorDemandas } from '@/features/recebimento/lib/recebimento-api';

import {
  fetchRcServerDemandStatus,
  hasRcReplicacheServerMismatch,
} from '../lib/rc-server-sync-status';
import {
  syncRcChecklistPhotos,
  syncRcFinalizacaoPendente,
} from './sync-checklist-photos-rc.service';

export type SyncRcDemandaResult = {
  ok: boolean;
  mismatch: boolean;
  localSituacao?: string;
  serverSituacao?: string;
  message: string;
};

function resolveTargetSituacao(serverSituacao: string, isConferido: boolean): string {
  if (isConferido) {
    return 'conferido';
  }

  return serverSituacao;
}

/** Alinha a demanda local com a situação autoritativa do servidor. */
export async function reconcileRcDemandWithServer(
  rep: RecebimentoReplicache,
  preRecebimentoId: string,
): Promise<boolean> {
  const [local, server] = await Promise.all([
    rep.query((tx) => getDemanda(tx, preRecebimentoId)),
    fetchRcServerDemandStatus(preRecebimentoId),
  ]);

  if (!local || !server || server.error) {
    return false;
  }

  const targetSituacao = resolveTargetSituacao(server.situacao, server.isConferido);

  if (local.situacao === targetSituacao) {
    return false;
  }

  await rep.mutate.syncDemandaFromServer({
    preRecebimentoId,
    situacao: targetSituacao,
    recebimentoId: local.recebimentoId,
    dock: local.dock,
  });

  return true;
}

/** Alinha todas as demandas locais com a lista operador/servidor. */
export async function reconcileAllRcDemandsWithOperadorApi(
  rep: RecebimentoReplicache,
  unidadeId: string,
  operadorDemandasInput?: Awaited<ReturnType<typeof fetchOperadorDemandas>>,
): Promise<number> {
  const [localDemandas, operadorDemandas] = await Promise.all([
    rep.query(listDemandas),
    operadorDemandasInput
      ? Promise.resolve(operadorDemandasInput)
      : fetchOperadorDemandas(unidadeId).catch(() => []),
  ]);

  const operadorById = new Map(
    operadorDemandas.map((demanda) => [demanda.preRecebimentoId, demanda]),
  );

  let changed = 0;

  for (const local of localDemandas) {
    const operador = operadorById.get(local.preRecebimentoId);

    if (operador) {
      if (operador.situacao !== local.situacao) {
        await rep.mutate.syncDemandaFromServer({
          preRecebimentoId: local.preRecebimentoId,
          situacao: operador.situacao,
          recebimentoId: operador.recebimentoId ?? local.recebimentoId,
          dock: operador.dock ?? local.dock,
        });
        changed += 1;
      }
      continue;
    }

    if (!operador) {
      const reconciled = await reconcileRcDemandWithServer(rep, local.preRecebimentoId);
      if (reconciled) {
        changed += 1;
      }
    }
  }

  return changed;
}

/** Push pending mutations, then pull server snapshot into local Replicache. */
export async function refreshReplicacheFromServer(
  rep: RecebimentoReplicache,
): Promise<void> {
  try {
    await rep.push({ now: true });
  } catch {
    // Best-effort: validation errors are handled by callers / debug panel.
  }

  await rep.pull({ now: true });
}

export async function syncRcDemandaCompleta(
  rep: RecebimentoReplicache,
  preRecebimentoId: string,
): Promise<SyncRcDemandaResult> {
  await syncRcChecklistPhotos(rep, preRecebimentoId);
  await reconcileRcDemandWithServer(rep, preRecebimentoId);
  await syncRcFinalizacaoPendente(rep, preRecebimentoId);
  await refreshReplicacheFromServer(rep);
  await reconcileRcDemandWithServer(rep, preRecebimentoId);

  const [local, server] = await Promise.all([
    rep.query((tx) => getDemanda(tx, preRecebimentoId)),
    fetchRcServerDemandStatus(preRecebimentoId),
  ]);

  const mismatch = hasRcReplicacheServerMismatch({
    replicacheSituacao: local?.situacao,
    serverStatus: server,
  });

  const message = mismatch
    ? `Divergência persiste: aparelho=${local?.situacao ?? '?'} servidor=${server?.situacao ?? '?'}`
    : `Sincronizado: ${local?.situacao ?? server?.situacao ?? 'ok'}`;

  return {
    ok: !mismatch,
    mismatch,
    localSituacao: local?.situacao,
    serverSituacao: server?.situacao,
    message,
  };
}
