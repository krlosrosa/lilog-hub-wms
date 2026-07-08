import { request } from '@/lib/offline/api-client';

import {
  DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA,
  type ParametrosRecebimentoConferencia,
} from '../types/recebimento.schema';

const RECEBIMENTO_DOMINIO = 'recebimento';
const CONFERENCIA_CATEGORIA = 'conferencia';
const PARAMETROS_SUBTIPO = 'parametros';

type ConfiguracaoOperacionalApiResponse = {
  items: Array<{
    id: string;
    unidadeId: string;
    dominio: string;
    categoria: string;
    subtipo: string;
    nome: string;
    parametros: ParametrosRecebimentoConferencia;
    isPadrao: boolean;
    ativo: boolean;
  }>;
};

const cachePorUnidade = new Map<string, ParametrosRecebimentoConferencia>();

export function getCachedParametrosRecebimentoConferencia(
  unidadeId: string,
): ParametrosRecebimentoConferencia {
  return cachePorUnidade.get(unidadeId) ?? DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA;
}

export async function fetchParametrosRecebimentoConferencia(
  unidadeId: string,
): Promise<ParametrosRecebimentoConferencia> {
  const params = new URLSearchParams({
    unidadeId,
    dominio: RECEBIMENTO_DOMINIO,
    categoria: CONFERENCIA_CATEGORIA,
    subtipo: PARAMETROS_SUBTIPO,
    ativo: 'true',
  });

  try {
    const response = await request<ConfiguracaoOperacionalApiResponse>(
      `/operacional/configuracoes?${params.toString()}`,
    );

    const padrao =
      response.items.find((item) => item.isPadrao) ?? response.items[0];

    const parametros = padrao?.parametros ?? DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA;
    cachePorUnidade.set(unidadeId, {
      quantidadeModo: parametros.quantidadeModo,
      loteModo: parametros.loteModo,
      controlaPalete: parametros.controlaPalete ?? false,
      solicitarPesoPvar: parametros.solicitarPesoPvar ?? true,
      exigirEtiquetaPesoVariavel:
        parametros.exigirEtiquetaPesoVariavel ?? false,
      condicoesChecklist:
        parametros.condicoesChecklist?.length > 0
          ? parametros.condicoesChecklist
          : DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA.condicoesChecklist,
    });
    return cachePorUnidade.get(unidadeId)!;
  } catch {
    return DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA;
  }
}

export function resolveControlaPaleteConferencia(
  controlaPalete: boolean,
  _modoUnitizacao?: string | null,
): boolean {
  return controlaPalete;
}

export {
  RECEBIMENTO_DOMINIO,
  CONFERENCIA_CATEGORIA,
  PARAMETROS_SUBTIPO,
};
