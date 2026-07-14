import { apiRequest } from '@/lib/api';

import type {
  CentroOrigemApi,
  CreateCentroOrigemPayload,
  ListCentrosOrigemApiResponse,
  UpdateCentroOrigemPayload,
} from '@/features/centros-origem/types/centro-origem.api';
import type { CentroOrigemListaItem } from '@/features/centros-origem/types/centro-origem-form.schema';

type ListCentrosOrigemParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export function mapCentroOrigemToListaItem(
  item: CentroOrigemApi,
): CentroOrigemListaItem {
  return {
    centro: item.centro,
    nome: item.nome,
  };
}

export async function listCentrosOrigem(
  params: ListCentrosOrigemParams = {},
): Promise<ListCentrosOrigemApiResponse> {
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
  const path = query ? `/centros-origem?${query}` : '/centros-origem';

  return apiRequest<ListCentrosOrigemApiResponse>(path);
}

export function getCentroOrigem(centro: string) {
  return apiRequest<CentroOrigemApi>(
    `/centros-origem/${encodeURIComponent(centro)}`,
  );
}

export function createCentroOrigem(payload: CreateCentroOrigemPayload) {
  return apiRequest<CentroOrigemApi>('/centros-origem', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateCentroOrigem(
  centro: string,
  payload: UpdateCentroOrigemPayload,
) {
  return apiRequest<CentroOrigemApi>(
    `/centros-origem/${encodeURIComponent(centro)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function deleteCentroOrigem(centro: string) {
  return apiRequest<void>(
    `/centros-origem/${encodeURIComponent(centro)}`,
    {
      method: 'DELETE',
    },
  );
}
