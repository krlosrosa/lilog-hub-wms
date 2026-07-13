import { apiRequest } from '@/lib/api';

import type {
  CentroApi,
  CreateCentroPayload,
  CreateUnidadePayload,
  ListUnidadesApiResponse,
  UnidadeApi,
  UpdateCentroPayload,
  UpdateUnidadePayload,
} from '@/features/filiais/types/unidade.api';
import type { FiltroCluster } from '@/features/filiais/types/filial-lista.schema';
import type { FilialListaItem } from '@/features/filiais/types/filial-lista.schema';
import type { ClusterValue } from '@/features/filiais/types/filial.schema';

type ListUnidadesParams = {
  page?: number;
  limit?: number;
  cluster?: FiltroCluster;
  search?: string;
};

export type UserUnidadeApi = {
  id: string;
  nome: string;
  nomeFilial: string;
  cluster: ClusterValue;
};

export type ListMyUnidadesApiResponse = {
  items: UserUnidadeApi[];
};

export function mapUnidadeToListaItem(unidade: UnidadeApi): FilialListaItem {
  return {
    id: unidade.id,
    nome: unidade.nome,
    nomeFilial: unidade.nomeFilial,
    cluster: unidade.cluster,
    centrosCount: unidade.centros.length,
  };
}

export function mapMyUnidadeToListaItem(unidade: UserUnidadeApi): FilialListaItem {
  return {
    id: unidade.id,
    nome: unidade.nome,
    nomeFilial: unidade.nomeFilial,
    cluster: unidade.cluster,
    centrosCount: 0,
  };
}

export async function listMyUnidades(): Promise<ListMyUnidadesApiResponse> {
  return apiRequest<ListMyUnidadesApiResponse>('/auth/me/unidades');
}

export async function listUnidades(
  params: ListUnidadesParams = {},
): Promise<ListUnidadesApiResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.cluster && params.cluster !== 'todos') {
    searchParams.set('cluster', params.cluster);
  }

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  const query = searchParams.toString();
  const path = query ? `/unidades?${query}` : '/unidades';

  return apiRequest<ListUnidadesApiResponse>(path);
}

export function getUnidade(id: string) {
  return apiRequest<UnidadeApi>(`/unidades/${encodeURIComponent(id)}`);
}

export function createUnidade(payload: CreateUnidadePayload) {
  return apiRequest<UnidadeApi>('/unidades', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUnidade(id: string, payload: UpdateUnidadePayload) {
  return apiRequest<UnidadeApi>(`/unidades/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteUnidade(id: string) {
  return apiRequest<void>(`/unidades/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function addCentro(unidadeId: string, payload: CreateCentroPayload) {
  return apiRequest<CentroApi>(
    `/unidades/${encodeURIComponent(unidadeId)}/centros`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function updateCentro(
  unidadeId: string,
  centroId: string,
  payload: UpdateCentroPayload,
) {
  return apiRequest<CentroApi>(
    `/unidades/${encodeURIComponent(unidadeId)}/centros/${encodeURIComponent(centroId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function deleteCentro(unidadeId: string, centroId: string) {
  return apiRequest<void>(
    `/unidades/${encodeURIComponent(unidadeId)}/centros/${encodeURIComponent(centroId)}`,
    {
      method: 'DELETE',
    },
  );
}
