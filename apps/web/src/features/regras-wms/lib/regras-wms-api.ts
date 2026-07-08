import { apiRequest } from '@/lib/api';

import type {
  CreateRegraProcessoPayload,
  ListRegrasProcessoApiResponse,
  ListRegrasProcessoParams,
  RegraProcessoApi,
  UpdateRegraProcessoPayload,
} from '@/features/regras-wms/types/regra-wms.api';

export async function listRegrasWms(
  params: ListRegrasProcessoParams,
): Promise<ListRegrasProcessoApiResponse> {
  const searchParams = new URLSearchParams({
    unidadeId: params.unidadeId,
  });

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.gatilho) {
    searchParams.set('gatilho', params.gatilho);
  }

  if (params.ativo !== undefined) {
    searchParams.set('ativo', String(params.ativo));
  }

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  return apiRequest<ListRegrasProcessoApiResponse>(
    `/regras-processo?${searchParams.toString()}`,
  );
}

export function findRegraWms(id: string) {
  return apiRequest<RegraProcessoApi>(
    `/regras-processo/${encodeURIComponent(id)}`,
  );
}

export function createRegraWms(payload: CreateRegraProcessoPayload) {
  return apiRequest<RegraProcessoApi>('/regras-processo', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateRegraWms(
  id: string,
  payload: UpdateRegraProcessoPayload,
) {
  return apiRequest<RegraProcessoApi>(
    `/regras-processo/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function deleteRegraWms(id: string) {
  return apiRequest<void>(`/regras-processo/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
