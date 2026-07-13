import { request } from '@/lib/api-client';

import type {
  ListFuncionariosApoioCandidatosApiResponse,
  ListSessoesApiResponse,
  RecursosDevolucaoSessaoApiResponse,
  RecursosSessaoApiResponse,
  SessaoFuncionarioApoioApi,
} from '@/features/gestao-recursos/types/gestao-recursos.api';

export function getRecursosSessao(sessaoId: string) {
  return request<RecursosSessaoApiResponse>(
    `/op-wms/sessoes/${encodeURIComponent(sessaoId)}/recursos`,
  );
}

export function getRecursosDevolucaoSessao(sessaoId: string) {
  return request<RecursosDevolucaoSessaoApiResponse>(
    `/devolucao/sessoes/${encodeURIComponent(sessaoId)}/recursos`,
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

export function getApoioCandidatos(sessaoId: string) {
  return request<ListFuncionariosApoioCandidatosApiResponse>(
    `/sessao-operacao/sessoes/${encodeURIComponent(sessaoId)}/apoios/candidatos`,
  );
}

export function adicionarFuncionarioApoio(
  sessaoId: string,
  funcionarioId: number,
) {
  return request<SessaoFuncionarioApoioApi>(
    `/sessao-operacao/sessoes/${encodeURIComponent(sessaoId)}/apoios`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ funcionarioId }),
    },
  );
}

export function encerrarFuncionarioApoio(
  sessaoId: string,
  sessaoFuncionarioId: string,
) {
  return request<SessaoFuncionarioApoioApi>(
    `/sessao-operacao/sessoes/${encodeURIComponent(sessaoId)}/apoios/${encodeURIComponent(sessaoFuncionarioId)}`,
    { method: 'DELETE' },
  );
}
