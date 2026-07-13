import { request } from '@/lib/api-client';

import type {
  AlocacaoRecebimentoApi,
  RecursosRecebimentoSessaoApiResponse,
} from '@/features/gestao-recursos-recebimento/types/recebimento-recursos.api';

export function getRecursosRecebimentoSessao(
  sessaoId: string,
  unidadeId: string,
) {
  const params = new URLSearchParams({ unidadeId });
  return request<RecursosRecebimentoSessaoApiResponse>(
    `/recebimentos/sessoes/${encodeURIComponent(sessaoId)}/recursos?${params.toString()}`,
  );
}

export function criarAlocacaoRecebimento(body: {
  unidadeId: string;
  preRecebimentoId: string;
  sessaoId: string;
  sessaoFuncionarioId: string;
}) {
  return request<AlocacaoRecebimentoApi>('/recebimentos/alocacoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function cancelarAlocacaoRecebimento(id: string) {
  return request<AlocacaoRecebimentoApi>(
    `/recebimentos/alocacoes/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}

export function liberarImpedimentoRecebimento(preRecebimentoId: string) {
  return request<{ preRecebimentoId: string; impedimentoId: string }>(
    `/pre-recebimentos/${encodeURIComponent(preRecebimentoId)}/retomar-conferencia`,
    { method: 'PUT' },
  );
}
