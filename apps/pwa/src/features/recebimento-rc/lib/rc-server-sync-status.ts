import {
  fetchConferenciaContext,
  fetchPreRecebimentoDetalhe,
} from '@/features/recebimento/lib/recebimento-api';

export type RcServerDemandStatus = {
  fetchedAt: string;
  situacao: string;
  recebimentoSituacao: string | null;
  isConferido: boolean;
  error?: string;
};

function resolveAuthoritativeSituacao(
  preRecebimentoSituacao: string,
  recebimentoSituacao: string | null,
): string {
  const recebimento = recebimentoSituacao ?? null;

  if (recebimento === 'conferido') {
    return 'conferido';
  }

  if (recebimento === 'em_conferencia') {
    return 'em_conferencia';
  }

  if (preRecebimentoSituacao === 'conferido') {
    return 'conferido';
  }

  if (preRecebimentoSituacao === 'em_conferencia') {
    return 'em_conferencia';
  }

  return preRecebimentoSituacao;
}

export function isRcServerDemandConferido(status: RcServerDemandStatus | null | undefined): boolean {
  if (!status || status.error) {
    return false;
  }

  return status.isConferido;
}

async function fetchRcServerDemandStatusFromDetalhe(
  preRecebimentoId: string,
): Promise<RcServerDemandStatus | null> {
  const detalhe = await fetchPreRecebimentoDetalhe(preRecebimentoId);
  const preSituacao = detalhe.preRecebimento.situacao;
  const recebimentoSituacao = detalhe.recebimento?.situacao ?? null;
  const authoritativeSituacao = resolveAuthoritativeSituacao(
    preSituacao,
    recebimentoSituacao,
  );

  return {
    fetchedAt: new Date().toISOString(),
    situacao: preSituacao,
    recebimentoSituacao,
    isConferido: authoritativeSituacao === 'conferido',
  };
}

export async function fetchRcServerDemandStatus(
  preRecebimentoId: string,
): Promise<RcServerDemandStatus | null> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return null;
  }

  try {
    const ctx = await fetchConferenciaContext(preRecebimentoId);
    const authoritativeSituacao = resolveAuthoritativeSituacao(
      ctx.situacao,
      ctx.recebimentoSituacao,
    );

    return {
      fetchedAt: new Date().toISOString(),
      situacao: ctx.situacao,
      recebimentoSituacao: ctx.recebimentoSituacao,
      isConferido: authoritativeSituacao === 'conferido',
    };
  } catch {
    try {
      return await fetchRcServerDemandStatusFromDetalhe(preRecebimentoId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao consultar servidor';
      return {
        fetchedAt: new Date().toISOString(),
        situacao: '—',
        recebimentoSituacao: null,
        isConferido: false,
        error: message,
      };
    }
  }
}

export function hasRcReplicacheServerMismatch(input: {
  replicacheSituacao?: string;
  serverStatus: RcServerDemandStatus | null | undefined;
}): boolean {
  const { replicacheSituacao, serverStatus } = input;
  if (!replicacheSituacao || !serverStatus || serverStatus.error) {
    return false;
  }

  const localConferido = replicacheSituacao === 'conferido';
  const serverConferido = isRcServerDemandConferido(serverStatus);

  return localConferido !== serverConferido;
}
