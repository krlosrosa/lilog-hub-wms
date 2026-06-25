import { request } from '@/lib/api-client';

import type {
  ListSessoesApiResponse,
  RecursosSessaoApiResponse,
} from '@/features/gestao-recursos/types/gestao-recursos.api';

export function getRecursosSessao(sessaoId: string) {
  return request<RecursosSessaoApiResponse>(
    `/op-wms/sessoes/${encodeURIComponent(sessaoId)}/recursos`,
  );
}

export function listSessoesAbertas(unidadeId: string) {
  const searchParams = new URLSearchParams({
    unidadeId,
    status: 'aberta',
    limit: '50',
  });

  return request<ListSessoesApiResponse>(
    `/sessao-operacao/sessoes?${searchParams.toString()}`,
  );
}
