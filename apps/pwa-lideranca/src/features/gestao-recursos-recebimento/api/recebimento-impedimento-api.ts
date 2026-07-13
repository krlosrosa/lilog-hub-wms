import { request } from '@/lib/api-client';

import type {
  DocumentoApi,
  PreRecebimentoImpedimentoDetalheApi,
} from '@/features/gestao-recursos-recebimento/types/impedimento-detalhe.api';

export function getPreRecebimentoImpedimentoDetalhe(preRecebimentoId: string) {
  return request<PreRecebimentoImpedimentoDetalheApi>(
    `/pre-recebimentos/${encodeURIComponent(preRecebimentoId)}/detalhe`,
  );
}

export async function listImpedimentoDocumentos(
  preRecebimentoId: string,
): Promise<DocumentoApi[]> {
  const params = new URLSearchParams({
    entidadeTipo: 'impedimento_recebimento',
    entidadeId: preRecebimentoId,
    status: 'ativo',
    page: '1',
    limit: '50',
  });

  const result = await request<{ items: DocumentoApi[] }>(
    `/documentos?${params.toString()}`,
  );

  return result.items ?? [];
}

export async function getDocumentDownloadUrl(documentoId: string): Promise<string> {
  const result = await request<{ downloadUrl: string }>(
    `/documentos/${encodeURIComponent(documentoId)}/url`,
  );

  return result.downloadUrl;
}
