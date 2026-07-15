import type { SyncBatchRequest, SyncBatchResult } from '@lilog/contracts';

import { request } from '@/lib/offline/api-client';

import type {
  ProcessList,
  ProductDataset,
  RecebimentoPackage,
  RecebimentoSnapshot,
  ReferenceData,
} from '../types/recebimento-v2.schema';

export async function fetchProcesses(
  unidadeId: string,
  cursor?: string,
  limit = 200,
): Promise<ProcessList> {
  const params = new URLSearchParams({ unidadeId, limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return request<ProcessList>(`/sync/adapters/recebimento-v2/processes?${params}`);
}

export async function fetchProducts(
  unidadeId: string,
  cursor?: string,
  limit = 500,
): Promise<ProductDataset> {
  const params = new URLSearchParams({ unidadeId, limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return request<ProductDataset>(`/sync/datasets/products?${params}`);
}

export async function fetchReferenceData(
  unidadeId: string,
  cursor?: string,
): Promise<ReferenceData> {
  const params = new URLSearchParams({ unidadeId });
  if (cursor) params.set('cursor', cursor);
  return request<ReferenceData>(`/sync/datasets/recebimento-reference?${params}`);
}

export async function fetchPackage(demandId: string): Promise<RecebimentoPackage> {
  return request<RecebimentoPackage>(
    `/sync/adapters/recebimento-v2/processes/${encodeURIComponent(demandId)}/package`,
  );
}

export async function fetchSnapshot(demandId: string): Promise<RecebimentoSnapshot> {
  return request<RecebimentoSnapshot>(
    `/sync/adapters/recebimento-v2/processes/${encodeURIComponent(demandId)}/snapshot`,
  );
}

export async function pushBatch(batch: SyncBatchRequest): Promise<SyncBatchResult> {
  return request<SyncBatchResult>('/sync/batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batch),
  });
}

export async function encerrarApoioRecebimento(apoioId: string): Promise<void> {
  await request(`/recebimentos/alocacoes/apoios/${encodeURIComponent(apoioId)}/encerrar`, {
    method: 'POST',
  });
}

export type ReabrirConferenciaResponse = {
  id: string;
  situacao: string;
};

export async function reabrirConferencia(
  recebimentoId: string,
): Promise<ReabrirConferenciaResponse> {
  return request<ReabrirConferenciaResponse>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/reabrir`,
    { method: 'PUT' },
  );
}
