import { apiRequest } from '@/lib/api';

import type {
  ListPlacasResponse,
  PlacaTransportadora,
  SincronizarPlacasResponse,
} from '@/features/transporte/types/placa-transportadora.schema';

type ListPlacasParams = {
  page?: number;
  limit?: number;
  search?: string;
  tipoVeiculo?: string;
};

export async function listPlacas(
  transportadoraId: string,
  params: ListPlacasParams = {},
): Promise<ListPlacasResponse> {
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

  if (params.tipoVeiculo?.trim()) {
    searchParams.set('tipoVeiculo', params.tipoVeiculo.trim());
  }

  const query = searchParams.toString();
  const path = query
    ? `/transportadoras/${transportadoraId}/placas?${query}`
    : `/transportadoras/${transportadoraId}/placas`;

  return apiRequest<ListPlacasResponse>(path);
}

export async function listPlacasUnidade(
  unidadeId: string,
  params: ListPlacasParams = {},
): Promise<ListPlacasResponse> {
  const searchParams = new URLSearchParams({ unidadeId });

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  if (params.tipoVeiculo?.trim()) {
    searchParams.set('tipoVeiculo', params.tipoVeiculo.trim());
  }

  return apiRequest<ListPlacasResponse>(
    `/transportadoras/placas?${searchParams.toString()}`,
  );
}

export async function listAllPlacasUnidade(
  unidadeId: string,
): Promise<PlacaTransportadora[]> {
  const pageSize = 200;
  let page = 1;
  const items: PlacaTransportadora[] = [];
  let total = 0;

  do {
    const response = await listPlacasUnidade(unidadeId, {
      page,
      limit: pageSize,
    });

    items.push(...response.items);
    total = response.total;
    page += 1;

    if (response.items.length === 0) {
      break;
    }
  } while (items.length < total);

  return items;
}

const BUSCA_PLACAS_CHUNK_SIZE = 200;

export type BuscarPlacasUnidadeResponse = {
  items: PlacaTransportadora[];
};

export async function buscarPlacasUnidadePorPlacas(
  unidadeId: string,
  placas: string[],
): Promise<PlacaTransportadora[]> {
  const unicas = [...new Set(placas.map((placa) => placa.trim()).filter(Boolean))];

  if (unicas.length === 0) {
    return [];
  }

  const items: PlacaTransportadora[] = [];

  for (let offset = 0; offset < unicas.length; offset += BUSCA_PLACAS_CHUNK_SIZE) {
    const chunk = unicas.slice(offset, offset + BUSCA_PLACAS_CHUNK_SIZE);
    const response = await apiRequest<BuscarPlacasUnidadeResponse>(
      '/transportadoras/placas/buscar',
      {
        method: 'POST',
        body: JSON.stringify({ unidadeId, placas: chunk }),
      },
    );

    items.push(...response.items);
  }

  return items;
}

export async function sincronizarPlacas(
  transportadoraId: string,
): Promise<SincronizarPlacasResponse> {
  return apiRequest<SincronizarPlacasResponse>(
    `/transportadoras/${transportadoraId}/placas/sincronizar`,
    {
      method: 'POST',
    },
  );
}

export async function atualizarPerfilPlaca(
  placaId: string,
  perfilTarifaId: string | null,
): Promise<PlacaTransportadora> {
  return apiRequest<PlacaTransportadora>(
    `/transportadoras/placas/${placaId}/perfil`,
    {
      method: 'PATCH',
      body: JSON.stringify({ perfilTarifaId }),
    },
  );
}

export type AtualizarPerfilPlacasMassaResponse = {
  atualizadas: number;
};

export async function atualizarPerfilPlacasMassa(
  placaIds: string[],
  perfilTarifaId: string | null,
): Promise<AtualizarPerfilPlacasMassaResponse> {
  return apiRequest<AtualizarPerfilPlacasMassaResponse>(
    '/transportadoras/placas/perfil/massa',
    {
      method: 'PATCH',
      body: JSON.stringify({ placaIds, perfilTarifaId }),
    },
  );
}

export type { PlacaTransportadora, ListPlacasResponse, SincronizarPlacasResponse };
