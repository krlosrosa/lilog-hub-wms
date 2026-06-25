import type {
  ConfiguracaoOperacionalApi,
  CreateConfiguracaoOperacionalApiPayload,
  ListConfiguracoesOperacionaisApiResponse,
  UpdateConfiguracaoOperacionalApiPayload,
} from '@/features/config-operacional/types/configuracao-operacional.api';
import type { EtapaProdutividade } from '@/features/config-operacional/types/regra-produtividade-tabs';
import type { TipoPausaRegra } from '@/features/regras-pausas/types/tipo-pausa-regra-tabs';
import { apiRequest } from '@/lib/api';

type ListConfiguracoesOperacionaisParams = {
  unidadeId: string;
  dominio?: string;
  categoria?: string;
  subtipo?: EtapaProdutividade | TipoPausaRegra;
  ativo?: boolean;
};

function buildListQuery(params: ListConfiguracoesOperacionaisParams): string {
  const search = new URLSearchParams({ unidadeId: params.unidadeId });

  if (params.dominio) search.set('dominio', params.dominio);
  if (params.categoria) search.set('categoria', params.categoria);
  if (params.subtipo) search.set('subtipo', params.subtipo);
  if (params.ativo !== undefined) search.set('ativo', String(params.ativo));

  return search.toString();
}

export function listarConfiguracoesOperacionais(
  params: ListConfiguracoesOperacionaisParams,
) {
  return apiRequest<ListConfiguracoesOperacionaisApiResponse>(
    `/operacional/configuracoes?${buildListQuery(params)}`,
  );
}

export function obterConfiguracaoOperacional(id: string) {
  return apiRequest<ConfiguracaoOperacionalApi>(
    `/operacional/configuracoes/${id}`,
  );
}

export function criarConfiguracaoOperacional(
  payload: CreateConfiguracaoOperacionalApiPayload,
) {
  return apiRequest<ConfiguracaoOperacionalApi>('/operacional/configuracoes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function atualizarConfiguracaoOperacional(
  id: string,
  payload: UpdateConfiguracaoOperacionalApiPayload,
) {
  return apiRequest<ConfiguracaoOperacionalApi>(
    `/operacional/configuracoes/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function deletarConfiguracaoOperacional(id: string) {
  return apiRequest<void>(`/operacional/configuracoes/${id}`, {
    method: 'DELETE',
  });
}

export function definirPadraoConfiguracaoOperacional(id: string) {
  return apiRequest<ConfiguracaoOperacionalApi>(
    `/operacional/configuracoes/${id}/padrao`,
    {
      method: 'PATCH',
    },
  );
}

export function duplicarConfiguracaoOperacional(id: string) {
  return apiRequest<ConfiguracaoOperacionalApi>(
    `/operacional/configuracoes/${id}/duplicar`,
    {
      method: 'POST',
    },
  );
}
