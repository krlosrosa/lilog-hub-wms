import { apiRequest } from '@/lib/api';

import type {
  CreateEscalaPayload,
  EscalaApi,
  EscalaFuncionarioApi,
  ListEscalaFuncionariosApiResponse,
  ListEscalasApiResponse,
} from '@/features/sessao-operacao/types/escala.api';
import type {
  CreateSessaoPayload,
  ListSessaoFuncionariosApiResponse,
  ListSessoesApiResponse,
  SessaoApi,
  SessaoFuncionarioApi,
  UpdateSessaoPresencaPayload,
} from '@/features/sessao-operacao/types/sessao.api';
import type {
  FuncionarioEquipeApiResponse,
  ListEquipesApiResponse,
} from '@/features/sessao-operacao/types/equipe.api';
import type {
  IniciarSessaoPausaPayload,
  ListSessaoFuncionarioPausasApiResponse,
  SessaoFuncionarioPausaApi,
} from '@/features/pausas/types/pausas.api';

type ListSessoesParams = {
  unidadeId: string;
  page?: number;
  limit?: number;
  status?: string;
  dataReferencia?: string;
};

export async function listSessoes(
  params: ListSessoesParams,
): Promise<ListSessoesApiResponse> {
  const searchParams = new URLSearchParams({
    unidadeId: params.unidadeId,
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  if (params.status) {
    searchParams.set('status', params.status);
  }

  if (params.dataReferencia) {
    searchParams.set('dataReferencia', params.dataReferencia);
  }

  return apiRequest<ListSessoesApiResponse>(
    `/sessao-operacao/sessoes?${searchParams.toString()}`,
  );
}

export function createSessao(payload: CreateSessaoPayload) {
  return apiRequest<SessaoApi>('/sessao-operacao/sessoes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getSessao(id: string) {
  return apiRequest<SessaoApi>(`/sessao-operacao/sessoes/${id}`);
}

export function abrirSessao(id: string) {
  return apiRequest<SessaoApi>(`/sessao-operacao/sessoes/${id}/abrir`, {
    method: 'PATCH',
  });
}

export function encerrarSessao(id: string) {
  return apiRequest<SessaoApi>(`/sessao-operacao/sessoes/${id}/encerrar`, {
    method: 'PATCH',
  });
}

export function cancelarSessao(id: string) {
  return apiRequest<SessaoApi>(`/sessao-operacao/sessoes/${id}/cancelar`, {
    method: 'PATCH',
  });
}

export function listSessaoFuncionarios(sessaoId: string) {
  return apiRequest<ListSessaoFuncionariosApiResponse>(
    `/sessao-operacao/sessoes/${sessaoId}/funcionarios`,
  );
}

export function updateSessaoFuncionarioPresenca(
  sessaoId: string,
  funcionarioId: number,
  payload: UpdateSessaoPresencaPayload,
) {
  return apiRequest<SessaoFuncionarioApi>(
    `/sessao-operacao/sessoes/${sessaoId}/funcionarios/${funcionarioId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function listSessaoFuncionarioPausas(
  sessaoId: string,
  funcionarioId: number,
) {
  return apiRequest<ListSessaoFuncionarioPausasApiResponse>(
    `/sessao-operacao/sessoes/${sessaoId}/funcionarios/${funcionarioId}/pausas`,
  );
}

export function iniciarSessaoFuncionarioPausa(
  sessaoId: string,
  funcionarioId: number,
  payload: IniciarSessaoPausaPayload,
) {
  return apiRequest<SessaoFuncionarioPausaApi>(
    `/sessao-operacao/sessoes/${sessaoId}/funcionarios/${funcionarioId}/pausas/iniciar`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function finalizarSessaoFuncionarioPausa(
  sessaoId: string,
  funcionarioId: number,
) {
  return apiRequest<SessaoFuncionarioPausaApi>(
    `/sessao-operacao/sessoes/${sessaoId}/funcionarios/${funcionarioId}/pausas/finalizar`,
    {
      method: 'PATCH',
    },
  );
}

type ListEscalasParams = {
  unidadeId: string;
  page?: number;
  limit?: number;
};

type ListEquipesParams = {
  unidadeId: string;
  page?: number;
  limit?: number;
};

export async function listEquipes(
  params: ListEquipesParams,
): Promise<ListEquipesApiResponse> {
  const searchParams = new URLSearchParams({
    unidadeId: params.unidadeId,
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 100),
    ativo: 'true',
  });

  return apiRequest<ListEquipesApiResponse>(
    `/sessao-operacao/equipes?${searchParams.toString()}`,
  );
}

export function getFuncionarioEquipe(funcionarioId: number) {
  return apiRequest<FuncionarioEquipeApiResponse>(
    `/sessao-operacao/equipes/by-funcionario/${funcionarioId}`,
  );
}

export function addEquipeFuncionario(equipeId: string, funcionarioId: number) {
  return apiRequest<EscalaFuncionarioApi>(
    `/sessao-operacao/equipes/${equipeId}/funcionarios`,
    {
      method: 'POST',
      body: JSON.stringify({ funcionarioId }),
    },
  );
}

export async function listEscalas(
  params: ListEscalasParams,
): Promise<ListEscalasApiResponse> {
  const searchParams = new URLSearchParams({
    unidadeId: params.unidadeId,
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  return apiRequest<ListEscalasApiResponse>(
    `/sessao-operacao/escalas?${searchParams.toString()}`,
  );
}

export function createEscala(payload: CreateEscalaPayload) {
  return apiRequest<EscalaApi>('/sessao-operacao/escalas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getEscala(id: string) {
  return apiRequest<EscalaApi>(`/sessao-operacao/escalas/${id}`);
}

export function listEscalaFuncionarios(escalaId: string) {
  return apiRequest<ListEscalaFuncionariosApiResponse>(
    `/sessao-operacao/escalas/${escalaId}/funcionarios`,
  );
}

export function addEscalaFuncionarios(
  escalaId: string,
  funcionarioIds: number[],
) {
  return apiRequest<import('@/features/sessao-operacao/types/escala.api').AddEscalaFuncionariosApiResponse>(
    `/sessao-operacao/escalas/${escalaId}/funcionarios`,
    {
      method: 'POST',
      body: JSON.stringify({ funcionarioIds }),
    },
  );
}

export function removeEscalaFuncionario(
  escalaId: string,
  funcionarioId: number,
) {
  return apiRequest<{ success: boolean }>(
    `/sessao-operacao/escalas/${escalaId}/funcionarios/${funcionarioId}`,
    {
      method: 'DELETE',
    },
  );
}
