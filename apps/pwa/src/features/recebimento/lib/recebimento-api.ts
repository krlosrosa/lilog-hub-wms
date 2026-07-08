import {
  ApiClientError,
  isApiConfigured,
  request,
} from '@/lib/offline/api-client';
import { mapProdutoApiResponse, type ProdutoApiResponse } from '@/lib/offline/produto-cache';

import type {
  AuthMeApi,
  ConferenciaContextApi,
  ConferirItemPayload,
  DocaApi,
  OperadorDemandaApi,
  RecebimentoApi,
  RecebimentoAvariaApi,
  SubmitAvariaPayload,
  IniciarRecebimentoPayload,
  ProdutoApi,
  ChecklistRecebimentoApi,
  DocumentoApi,
  SaveChecklistPayload,
} from '../types/recebimento.api';

export async function fetchOperadorDemandas(
  unidadeId: string,
): Promise<OperadorDemandaApi[]> {
  const normalizedUnidadeId = unidadeId?.trim();

  if (!normalizedUnidadeId) {
    throw new ApiClientError(
      'Selecione uma unidade antes de carregar as demandas.',
    );
  }

  const params = new URLSearchParams({ unidadeId: normalizedUnidadeId });
  const path = `/recebimentos/operador/demandas?${params.toString()}`;

  const result = await request<{ items: OperadorDemandaApi[] }>(path);
  return result.items ?? [];
}

export async function fetchConferenciaContext(
  preRecebimentoId: string,
): Promise<ConferenciaContextApi> {
  return request<ConferenciaContextApi>(
    `/pre-recebimentos/${encodeURIComponent(preRecebimentoId)}/conferencia`,
  );
}

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
  return exact ?? items[0] ?? null;
}

export async function fetchAllProdutos(): Promise<ProdutoApi[]> {
  const all: ProdutoApi[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (all.length < total) {
    const params = new URLSearchParams({
      page: String(page),
      limit: '100',
    });
    const result = await request<{
      items: ProdutoApiResponse[];
      total: number;
    }>(`/produtos?${params.toString()}`);

    all.push(...result.items.map((item) => mapProdutoApiResponse(item)));
    total = result.total;

    if (result.items.length === 0) break;
    page += 1;
  }

  return all;
}

export async function conferirItem(
  recebimentoId: string,
  payload: ConferirItemPayload,
) {
  return request<{ id: string; produtoId: string; quantidadeRecebida: number }>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/itens`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

export async function removerConferenciaItem(
  recebimentoId: string,
  produtoId: string,
) {
  return request<{ produtoId: string; removedCount: number }>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/itens/${encodeURIComponent(produtoId)}`,
    { method: 'DELETE' },
  );
}

export async function removerLinhaConferenciaRecebimento(
  recebimentoId: string,
  itemId: string,
) {
  return request<{ itemId: string; removed: true; produtoId?: string }>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/itens-linha/${encodeURIComponent(itemId)}`,
    { method: 'DELETE' },
  );
}

export async function removerPaleteConferenciaRecebimento(
  recebimentoId: string,
  unitizadorCodigo: string,
  produtoId?: string,
) {
  const params = produtoId
    ? `?produtoId=${encodeURIComponent(produtoId)}`
    : '';
  return request<{
    unitizadorCodigo: string;
    unitizadorId: string;
    removedCount: number;
  }>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/paletes/${encodeURIComponent(unitizadorCodigo)}${params}`,
    { method: 'DELETE' },
  );
}

export async function encerrarConferencia(recebimentoId: string) {
  return request<RecebimentoApi>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/encerrar`,
    { method: 'PUT' },
  );
}

export async function submitAvaria(
  recebimentoId: string,
  payload: SubmitAvariaPayload,
) {
  return request<{ items: RecebimentoAvariaApi[] }>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/avarias`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

export async function listAvarias(recebimentoId: string) {
  const result = await request<{ items: RecebimentoAvariaApi[] }>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/avarias`,
  );
  return result.items ?? [];
}


export async function iniciarRecebimento(payload: IniciarRecebimentoPayload) {
  return request<RecebimentoApi>('/recebimentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function saveChecklist(
  recebimentoId: string,
  payload: SaveChecklistPayload,
) {
  return request<{ id: string; recebimentoId: string }>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/checklist`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

export async function fetchChecklist(
  recebimentoId: string,
): Promise<ChecklistRecebimentoApi> {
  return request<ChecklistRecebimentoApi>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/checklist`,
  );
}

export async function listChecklistDocumentos(
  recebimentoId: string,
): Promise<DocumentoApi[]> {
  const params = new URLSearchParams({
    entidadeTipo: 'checklist_recebimento',
    entidadeId: recebimentoId,
    status: 'ativo',
    page: '1',
    limit: '50',
  });
  const result = await request<{ items: DocumentoApi[] }>(
    `/documentos?${params.toString()}`,
  );
  return result.items ?? [];
}

export async function getDocumentDownloadUrl(
  documentoId: string,
): Promise<string> {
  const result = await request<{ downloadUrl: string }>(
    `/documentos/${encodeURIComponent(documentoId)}/url`,
  );
  return result.downloadUrl;
}

export async function listDocas(unidadeId: string): Promise<DocaApi[]> {
  const params = new URLSearchParams({
    unidadeId,
    page: '1',
    limit: '50',
  });
  const result = await request<{ items: DocaApi[] }>(
    `/docas?${params.toString()}`,
  );
  return result.items ?? [];
}

export async function fetchAuthMe(): Promise<AuthMeApi | null> {
  if (!isApiConfigured()) return null;
  try {
    return await request<AuthMeApi>('/auth/me');
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function getRecebimentoByPreRecebimento(
  preRecebimentoId: string,
): Promise<RecebimentoApi | null> {
  try {
    return await request<RecebimentoApi>(
      `/pre-recebimentos/${encodeURIComponent(preRecebimentoId)}/recebimento`,
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
