import { apiRequest } from '@/lib/api';

import type {
  CreateRegraEnderecamentoPayload,
  ListRegrasEnderecamentoApiResponse,
  ListRegrasEnderecamentoParams,
  RegraEnderecamentoApi,
  UpdateRegraEnderecamentoPayload,
} from '@/features/regras-enderecamento/types/regra-enderecamento.api';
import type { RegraEnderecamentoListaItem } from '@/features/regras-enderecamento/types/regra-enderecamento.schema';

export async function listRegrasEnderecamento(
  params: ListRegrasEnderecamentoParams,
): Promise<ListRegrasEnderecamentoApiResponse> {
  const searchParams = new URLSearchParams({
    unidadeId: params.unidadeId,
  });

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.criterioTipo) {
    searchParams.set('criterioTipo', params.criterioTipo);
  }

  if (params.ativo !== undefined) {
    searchParams.set('ativo', String(params.ativo));
  }

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  return apiRequest<ListRegrasEnderecamentoApiResponse>(
    `/armazenagem/regras-enderecamento?${searchParams.toString()}`,
  );
}

export function mapRegraToListaItem(
  item: RegraEnderecamentoApi,
): RegraEnderecamentoListaItem {
  return {
    id: item.id,
    nome: item.nome,
    criterioTipo: item.criterioTipo,
    criterioValor: item.criterioValor,
    prioridade: item.prioridade,
    ativo: item.ativo,
    destinos: item.destinos.map((destino) => ({
      id: destino.id,
      prioridade: destino.prioridade,
      tipo: destino.tipo,
      zona: destino.zona,
      rua: destino.rua,
      enderecoId: destino.enderecoId,
      enderecoLabel: destino.enderecoLabel,
      ativo: destino.ativo,
    })),
    createdAt: item.createdAt,
  };
}

export async function getRegraEnderecamento(id: string) {
  return apiRequest<RegraEnderecamentoApi>(
    `/armazenagem/regras-enderecamento/${encodeURIComponent(id)}`,
  );
}

export function createRegraEnderecamento(payload: CreateRegraEnderecamentoPayload) {
  return apiRequest<RegraEnderecamentoApi>('/armazenagem/regras-enderecamento', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateRegraEnderecamento(
  id: string,
  payload: UpdateRegraEnderecamentoPayload,
) {
  return apiRequest<RegraEnderecamentoApi>(
    `/armazenagem/regras-enderecamento/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function deleteRegraEnderecamento(id: string) {
  return apiRequest<void>(
    `/armazenagem/regras-enderecamento/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}
