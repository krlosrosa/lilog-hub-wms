import { apiRequest } from '@/lib/api';

import type {
  ConfiguracaoImpressaoApi,
  CreateConfiguracaoImpressaoApiPayload,
  ListConfiguracoesImpressaoApiResponse,
  UpdateConfiguracaoImpressaoApiPayload,
} from '@/features/expedicao-impressao-config/types/configuracao-impressao.api';

export function listarConfiguracoesImpressao(unidadeId: string) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<ListConfiguracoesImpressaoApiResponse>(
    `/expedicao/configuracoes-impressao?${params.toString()}`,
  );
}

export function criarConfiguracaoImpressao(
  payload: CreateConfiguracaoImpressaoApiPayload,
) {
  return apiRequest<ConfiguracaoImpressaoApi>(
    '/expedicao/configuracoes-impressao',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function atualizarConfiguracaoImpressao(
  id: string,
  payload: UpdateConfiguracaoImpressaoApiPayload,
) {
  return apiRequest<ConfiguracaoImpressaoApi>(
    `/expedicao/configuracoes-impressao/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function deletarConfiguracaoImpressao(id: string) {
  return apiRequest<void>(`/expedicao/configuracoes-impressao/${id}`, {
    method: 'DELETE',
  });
}

export function definirPadraoConfiguracaoImpressao(id: string) {
  return apiRequest<ConfiguracaoImpressaoApi>(
    `/expedicao/configuracoes-impressao/${id}/padrao`,
    {
      method: 'PATCH',
    },
  );
}
