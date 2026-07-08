import { request } from '@/lib/offline/api-client';

import {
  DEFAULT_PARAMETROS_DEVOLUCAO_CONFERENCIA,
  type ParametrosDevolucaoConferencia,
} from '../types/devolucao.schema';

const DEVOLUCAO_DOMINIO = 'devolucao';
const CONFERENCIA_CATEGORIA = 'conferencia';
const PARAMETROS_SUBTIPO = 'parametros';
const CONFIG_NOME = 'Parâmetros padrão';

type ConfiguracaoOperacionalApiResponse = {
  items: Array<{
    id: string;
    unidadeId: string;
    dominio: string;
    categoria: string;
    subtipo: string;
    nome: string;
    parametros: ParametrosDevolucaoConferencia;
    isPadrao: boolean;
    ativo: boolean;
  }>;
};

const cachePorUnidade = new Map<string, ParametrosDevolucaoConferencia>();

export function getCachedParametrosDevolucaoConferencia(
  unidadeId: string,
): ParametrosDevolucaoConferencia {
  return cachePorUnidade.get(unidadeId) ?? DEFAULT_PARAMETROS_DEVOLUCAO_CONFERENCIA;
}

export async function fetchParametrosDevolucaoConferencia(
  unidadeId: string,
): Promise<ParametrosDevolucaoConferencia> {
  const params = new URLSearchParams({
    unidadeId,
    dominio: DEVOLUCAO_DOMINIO,
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

    const parametros = padrao?.parametros ?? DEFAULT_PARAMETROS_DEVOLUCAO_CONFERENCIA;
    cachePorUnidade.set(unidadeId, {
      quantidadeModo: parametros.quantidadeModo,
      loteModo: parametros.loteModo,
      controlaPalete: parametros.controlaPalete ?? false,
      condicoesChecklist:
        parametros.condicoesChecklist?.length > 0
          ? parametros.condicoesChecklist
          : DEFAULT_PARAMETROS_DEVOLUCAO_CONFERENCIA.condicoesChecklist,
    });
    return cachePorUnidade.get(unidadeId)!;
  } catch {
    return DEFAULT_PARAMETROS_DEVOLUCAO_CONFERENCIA;
  }
}

export {
  DEVOLUCAO_DOMINIO,
  CONFERENCIA_CATEGORIA,
  PARAMETROS_SUBTIPO,
  CONFIG_NOME,
};
