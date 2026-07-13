import { request } from '@/lib/offline/api-client';
import {
  mapProdutoApiResponse,
  type ProdutoApiResponse,
} from '@/lib/offline/produto-cache';
import type { ProdutoApi } from '@/features/recebimento/types/recebimento.api';

import type {
  DemandaDetalheCache,
  DemandaDevolucaoStatusApi,
  DevolucaoFaltaPesoCache,
  DevolucaoItemCondicaoApi,
} from '@/features/devolucao/types/devolucao.schema';

export type BuscarDemandaDevolucaoApiResponse = DemandaDetalheCache & {
  createdAt: string;
  concluidaAt: string | null;
  eventos: Array<{
    id: string;
    statusAnterior: DemandaDevolucaoStatusApi | null;
    statusNovo: DemandaDevolucaoStatusApi;
    descricao: string | null;
    criadoPorUserId: number | null;
    createdAt: string;
  }>;
};

export type AtualizarStatusDevolucaoPayload = {
  status: DemandaDevolucaoStatusApi;
  observacao?: string;
};

export type AtualizarStatusDevolucaoApiResponse = {
  id: string;
  codigoDemanda: string;
  status: DemandaDevolucaoStatusApi;
  statusAnterior: DemandaDevolucaoStatusApi;
  updatedAt: string;
  concluidaAt: string | null;
};

export type RegistrarConferenciaItemPayload = {
  itemId: string;
  condicao?: DevolucaoItemCondicaoApi;
  qtdConferida: number;
  lote?: string | null;
  dataFabricacao?: string | null;
  observacao?: string | null;
};

export type RegistrarConferenciaItensPayload = {
  unidadeId: string;
  status?: Extract<
    DemandaDevolucaoStatusApi,
    'em_analise' | 'em_execucao' | 'conferida' | 'concluida'
  >;
  itens?: RegistrarConferenciaItemPayload[];
};

export type RegistrarConferenciaItensApiResponse = {
  demandaId: string;
  itensAtualizados: number;
  status?: DemandaDevolucaoStatusApi;
};

export type RegistrarAvariaDevolucaoPayload = {
  unidadeId: string;
  itemId?: string | null;
  tipo: string;
  natureza?: string | null;
  causa?: string | null;
  quantidadeCaixa?: number | null;
  quantidadeUnidade?: number | null;
  observacao?: string | null;
  photoUrls?: string[];
  replicarSkus?: string[];
};

export type RegistrarAvariaDevolucaoApiResponse = {
  id: string;
  demandaId: string;
  itemId: string | null;
  itensAfetados: number;
};

export type SalvarChecklistDevolucaoPayload = {
  dock: string;
  paletesRecebidos: number;
  tempBau?: number;
  tempProduto?: number;
  conditions: Record<string, boolean>;
  observacoes?: string;
  photoCount?: number;
};

export type SalvarChecklistDevolucaoApiResponse = {
  id: string;
  demandaId: string;
};

export async function searchProduto(term: string): Promise<ProdutoApi | null> {
  const params = new URLSearchParams({ search: term, limit: '5', page: '1' });
  const result = await request<{ items: ProdutoApiResponse[] }>(
    `/produtos?${params.toString()}`,
  );
  const normalized = term.trim().toLowerCase();
  const items = result.items.map((item) => mapProdutoApiResponse(item));
  const exact = items.find(
    (item) =>
      item.sku.toLowerCase() === normalized ||
      item.ean?.toLowerCase() === normalized,
  );
  return exact ?? null;
}

export function buscarDemandaDevolucao(demandaId: string, unidadeId: string) {
  const params = new URLSearchParams({ unidadeId });
  return request<BuscarDemandaDevolucaoApiResponse>(
    `/devolucao/demandas/${encodeURIComponent(demandaId)}?${params.toString()}`,
  );
}

export function listarFaltasPesoDevolucao(demandaId: string, unidadeId: string) {
  const params = new URLSearchParams({ unidadeId });
  return request<{ faltasPeso: DevolucaoFaltaPesoCache[] }>(
    `/devolucao/demandas/${encodeURIComponent(demandaId)}/faltas-peso?${params.toString()}`,
  );
}

export function atualizarStatusDevolucao(
  demandaId: string,
  unidadeId: string,
  payload: AtualizarStatusDevolucaoPayload,
) {
  const params = new URLSearchParams({ unidadeId });
  return request<AtualizarStatusDevolucaoApiResponse>(
    `/devolucao/demandas/${encodeURIComponent(demandaId)}/status?${params.toString()}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

export function registrarConferenciaItens(
  demandaId: string,
  payload: RegistrarConferenciaItensPayload,
) {
  return request<RegistrarConferenciaItensApiResponse>(
    `/devolucao/demandas/${encodeURIComponent(demandaId)}/conferencia`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

export function registrarAvariaDevolucao(
  demandaId: string,
  payload: RegistrarAvariaDevolucaoPayload,
) {
  return request<RegistrarAvariaDevolucaoApiResponse>(
    `/devolucao/demandas/${encodeURIComponent(demandaId)}/avarias`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

export function salvarChecklistDevolucao(
  demandaId: string,
  unidadeId: string,
  payload: SalvarChecklistDevolucaoPayload,
) {
  const params = new URLSearchParams({ unidadeId });
  return request<SalvarChecklistDevolucaoApiResponse>(
    `/devolucao/demandas/${encodeURIComponent(demandaId)}/checklist?${params.toString()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}
