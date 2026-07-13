import { request } from '@/lib/api-client';

import type {
  CreateSessaoPayload,
  ListEscalasApiResponse,
  ListSessaoFuncionariosApiResponse,
  ListSessoesApiResponse,
  SessaoApi,
  SessaoFuncionarioApi,
  UpdateSessaoPresencaPayload,
} from './types';

type ListSessoesParams = {
  unidadeId: string;
  page?: number;
  limit?: number;
  status?: string;
  dataReferencia?: string;
  dataReferenciaInicio?: string;
  dataReferenciaFim?: string;
};

type ListEscalasParams = {
  unidadeId: string;
  page?: number;
  limit?: number;
};

export async function listSessoes(
  params: ListSessoesParams,
): Promise<ListSessoesApiResponse> {
  const searchParams = new URLSearchParams({
    unidadeId: params.unidadeId,
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 50),
  });

  if (params.status) {
    searchParams.set('status', params.status);
  }

  if (params.dataReferenciaInicio && params.dataReferenciaFim) {
    searchParams.set('dataReferenciaInicio', params.dataReferenciaInicio);
    searchParams.set('dataReferenciaFim', params.dataReferenciaFim);
  } else if (params.dataReferencia) {
    searchParams.set('dataReferencia', params.dataReferencia);
  }

  return request<ListSessoesApiResponse>(
    `/sessao-operacao/sessoes?${searchParams.toString()}`,
  );
}

export function createSessao(payload: CreateSessaoPayload) {
  return request<SessaoApi>('/sessao-operacao/sessoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function getSessao(id: string) {
  return request<SessaoApi>(`/sessao-operacao/sessoes/${id}`);
}

export function abrirSessao(id: string) {
  return request<SessaoApi>(`/sessao-operacao/sessoes/${id}/abrir`, {
    method: 'PATCH',
  });
}

export function encerrarSessao(id: string) {
  return request<SessaoApi>(`/sessao-operacao/sessoes/${id}/encerrar`, {
    method: 'PATCH',
  });
}

export function listSessaoFuncionarios(sessaoId: string) {
  return request<ListSessaoFuncionariosApiResponse>(
    `/sessao-operacao/sessoes/${sessaoId}/funcionarios`,
  );
}

export function updateSessaoFuncionarioPresenca(
  sessaoId: string,
  funcionarioId: number,
  payload: UpdateSessaoPresencaPayload,
) {
  return request<SessaoFuncionarioApi>(
    `/sessao-operacao/sessoes/${sessaoId}/funcionarios/${funcionarioId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

export async function listEscalas(
  params: ListEscalasParams,
): Promise<ListEscalasApiResponse> {
  const searchParams = new URLSearchParams({
    unidadeId: params.unidadeId,
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 100),
  });

  return request<ListEscalasApiResponse>(
    `/sessao-operacao/escalas?${searchParams.toString()}`,
  );
}
