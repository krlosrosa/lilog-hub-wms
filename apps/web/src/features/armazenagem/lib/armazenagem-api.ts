import { apiRequest } from '@/lib/api';

import type { ListEnderecosApiResponse } from '@/features/enderecos/types/endereco.api';

import type {
  DemandaArmazenagemDetailApi,
  ItemArmazenagemApi,
  ListDemandasArmazenagemApiResponse,
} from '../types/armazenagem.api';

type ListDemandasParams = {
  unidadeId: string;
  page?: number;
  limit?: number;
  status?: string;
};

type ListEnderecosDisponiveisParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function listDemandasArmazenagem(
  params: ListDemandasParams,
): Promise<ListDemandasArmazenagemApiResponse> {
  const searchParams = new URLSearchParams({
    unidadeId: params.unidadeId,
  });

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.status) {
    searchParams.set('status', params.status);
  }

  return apiRequest<ListDemandasArmazenagemApiResponse>(
    `/armazenagem/demandas?${searchParams.toString()}`,
  );
}

export async function getDemandaArmazenagem(
  demandaId: string,
): Promise<DemandaArmazenagemDetailApi> {
  return apiRequest<DemandaArmazenagemDetailApi>(
    `/armazenagem/demandas/${encodeURIComponent(demandaId)}`,
  );
}

export async function listEnderecosDisponiveisArmazenagem(
  demandaId: string,
  itemId: string,
  params: ListEnderecosDisponiveisParams = {},
): Promise<ListEnderecosApiResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  const query = searchParams.toString();
  const suffix = query ? `?${query}` : '';

  return apiRequest<ListEnderecosApiResponse>(
    `/armazenagem/demandas/${encodeURIComponent(demandaId)}/itens/${encodeURIComponent(itemId)}/enderecos-disponiveis${suffix}`,
  );
}

export async function definirEnderecoSugeridoItemArmazenagem(
  demandaId: string,
  itemId: string,
  enderecoSugeridoId: string,
): Promise<ItemArmazenagemApi> {
  return apiRequest<ItemArmazenagemApi>(
    `/armazenagem/demandas/${encodeURIComponent(demandaId)}/itens/${encodeURIComponent(itemId)}/endereco-sugerido`,
    {
      method: 'PATCH',
      body: JSON.stringify({ enderecoSugeridoId }),
    },
  );
}

export async function validarDemandaArmazenagem(
  demandaId: string,
): Promise<DemandaArmazenagemDetailApi> {
  return apiRequest<DemandaArmazenagemDetailApi>(
    `/armazenagem/demandas/${encodeURIComponent(demandaId)}/validar`,
    { method: 'POST' },
  );
}
