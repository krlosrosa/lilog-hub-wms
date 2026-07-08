import { apiRequest } from '@/lib/api';

import type {
  ConfirmarCadastroRavexPayload,
  CreateTransportadoraPayload,
  ImportarTransportadoraRavexPayload,
  ListTransportadorasApiResponse,
  TransportadoraApi,
  TransportadoraRavexPreview,
  UpdateTransportadoraPayload,
} from '@/features/transporte/types/transportadora.api';
import {
  formatCnpj,
  type TransportadoraListaItem,
  type TransportadoraStatus,
} from '@/features/transporte/types/transportadora.schema';

type ListTransportadorasParams = {
  page?: number;
  limit?: number;
  unidadeId?: string;
  status?: TransportadoraStatus;
  search?: string;
};

export function mapTransportadoraToListaItem(
  transportadora: TransportadoraApi,
): TransportadoraListaItem {
  return {
    id: transportadora.id,
    nome: transportadora.nome,
    idRavexTransportadora: transportadora.idRavexTransportadora,
    cnpj: formatCnpj(transportadora.cnpj),
    status: transportadora.status,
    quantidadeVeiculos: transportadora.quantidadeVeiculos,
    emails: transportadora.emails ?? [],
  };
}

export async function listTransportadoras(
  params: ListTransportadorasParams = {},
): Promise<ListTransportadorasApiResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.unidadeId) {
    searchParams.set('unidadeId', params.unidadeId);
  }

  if (params.status) {
    searchParams.set('status', params.status);
  }

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  const query = searchParams.toString();
  const path = query ? `/transportadoras?${query}` : '/transportadoras';

  return apiRequest<ListTransportadorasApiResponse>(path);
}

export async function listAllTransportadorasUnidade(
  unidadeId: string,
): Promise<TransportadoraListaItem[]> {
  const pageSize = 100;
  let page = 1;
  const items: TransportadoraListaItem[] = [];
  let total = 0;

  do {
    const response = await listTransportadoras({
      unidadeId,
      page,
      limit: pageSize,
    });

    items.push(...response.items.map(mapTransportadoraToListaItem));
    total = response.total;
    page += 1;

    if (response.items.length === 0) {
      break;
    }
  } while (items.length < total);

  return items;
}

export async function createTransportadora(
  payload: CreateTransportadoraPayload,
): Promise<TransportadoraApi> {
  return apiRequest<TransportadoraApi>('/transportadoras', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTransportadora(
  id: string,
  payload: UpdateTransportadoraPayload,
): Promise<TransportadoraApi> {
  return apiRequest<TransportadoraApi>(`/transportadoras/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteTransportadora(id: string): Promise<void> {
  await apiRequest<void>(`/transportadoras/${id}`, {
    method: 'DELETE',
  });
}

export async function buscarTransportadoraRavexPorPlaca(
  placa: string,
  unidadeId: string,
): Promise<TransportadoraRavexPreview> {
  const placaNormalizada = placa.trim().toUpperCase();
  const searchParams = new URLSearchParams({ unidadeId });

  return apiRequest<TransportadoraRavexPreview>(
    `/transportadoras/ravex/placa/${encodeURIComponent(placaNormalizada)}?${searchParams.toString()}`,
  );
}

export async function buscarTransportadoraRavex(
  idRavexTransportadora: number,
  unidadeId: string,
): Promise<TransportadoraRavexPreview> {
  const searchParams = new URLSearchParams({ unidadeId });

  return apiRequest<TransportadoraRavexPreview>(
    `/transportadoras/ravex/${idRavexTransportadora}?${searchParams.toString()}`,
  );
}

export async function importarTransportadoraRavex(
  payload: ImportarTransportadoraRavexPayload,
): Promise<TransportadoraApi> {
  return apiRequest<TransportadoraApi>('/transportadoras/importar-ravex', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
