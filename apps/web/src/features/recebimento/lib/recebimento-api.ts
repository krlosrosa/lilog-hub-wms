import { apiRequest, ApiClientError, apiDownloadBlob, downloadBlobArquivo } from '@/lib/api';

import type {
  ChecklistRecebimentoApi,
  CreatePreRecebimentoPayload,
  DocumentoApi,
  ListPreRecebimentosApiResponse,
  ListPreRecebimentosParams,
  PreRecebimentoApi,
  PreRecebimentoSituacaoApi,
  RecebimentoAvariaApi,
  RecebimentoApi,
  RecepcionarCarroPayload,
  GerarLinkRastreioResponse,
} from '@/features/recebimento/types/recebimento.api';
import type {
  EtiquetaPaleteGerada,
  FinalizarRecebimentoComEtiquetas,
  PaleteBipadoValidadoFinalizacao,
  PaleteValidadoFinalizacao,
  PreviewPaletesArmazenagem,
  PreviewPaletesBipados,
  SugestaoEtiquetasRecebimento,
} from '@/features/recebimento/types/etiqueta-armazenagem.schema';
import type {
  RecebimentoListaItem,
  RecebimentoStatus,
} from '@/features/recebimento/types/recebimento-lista.schema';

function mapSituacaoToStatus(
  situacao: PreRecebimentoSituacaoApi,
): RecebimentoStatus {
  return situacao;
}

function formatHorario(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function isAtrasado(
  horarioPrevisto: string,
  situacao: PreRecebimentoSituacaoApi,
): boolean {
  if (
    situacao !== 'agendado' &&
    situacao !== 'aguardando' &&
    situacao !== 'liberado_para_conferencia'
  ) {
    return false;
  }

  return new Date(horarioPrevisto).getTime() < Date.now();
}

export function mapPreRecebimentoToListaItem(
  item: PreRecebimentoApi,
): RecebimentoListaItem {
  const volumeUn =
    item.itens?.reduce(
      (total, current) => total + current.quantidadeEsperada,
      0,
    ) ?? 0;

  return {
    id: item.id,
    placa: item.placa ?? 'Sem placa',
    transportador: item.transportadoraNome ?? '—',
    horario: formatHorario(item.horarioPrevisto),
    horarioPrevisto: item.horarioPrevisto,
    empresas: [item.unidadeId],
    status: mapSituacaoToStatus(item.situacao),
    volumeUn: Math.round(volumeUn),
    isAtrasado: isAtrasado(item.horarioPrevisto, item.situacao),
  };
}

export function createPreRecebimento(payload: CreatePreRecebimentoPayload) {
  return apiRequest<PreRecebimentoApi>('/pre-recebimentos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listPreRecebimentos(
  params: ListPreRecebimentosParams,
): Promise<ListPreRecebimentosApiResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  searchParams.set('unidadeId', params.unidadeId);
  if (params.situacao) searchParams.set('situacao', params.situacao);
  if (params.transportadoraNome) {
    searchParams.set('transportadoraNome', params.transportadoraNome);
  }
  if (params.dataInicio) searchParams.set('dataInicio', params.dataInicio);
  if (params.dataFim) searchParams.set('dataFim', params.dataFim);

  const query = searchParams.toString();
  const path = query ? `/pre-recebimentos?${query}` : '/pre-recebimentos';

  return apiRequest<ListPreRecebimentosApiResponse>(path);
}

export function getPreRecebimento(id: string) {
  return apiRequest<PreRecebimentoApi>(
    `/pre-recebimentos/${encodeURIComponent(id)}`,
  );
}

export async function getRecebimentoByPreRecebimento(
  preRecebimentoId: string,
): Promise<RecebimentoApi | null> {
  try {
    return await apiRequest<RecebimentoApi>(
      `/pre-recebimentos/${encodeURIComponent(preRecebimentoId)}/recebimento`,
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export function getRecebimento(id: string) {
  return apiRequest<RecebimentoApi>(
    `/recebimentos/${encodeURIComponent(id)}`,
  );
}

export function cancelPreRecebimento(id: string) {
  return apiRequest<PreRecebimentoApi>(
    `/pre-recebimentos/${encodeURIComponent(id)}/cancelar`,
    { method: 'PUT' },
  );
}

export function liberarConferencia(
  preRecebimentoId: string,
  payload: { docaId: string },
) {
  return apiRequest<PreRecebimentoApi>(
    `/pre-recebimentos/${encodeURIComponent(preRecebimentoId)}/liberar-conferencia`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  );
}

export function recepcionarCarro(
  preRecebimentoId: string,
  payload: RecepcionarCarroPayload,
) {
  return apiRequest<PreRecebimentoApi>(
    `/pre-recebimentos/${encodeURIComponent(preRecebimentoId)}/recepcionar-carro`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function finalizarRecebimento(
  recebimentoId: string,
  payload?: {
    paletes?: Array<{
      produtoId: string;
      qtdPaletes?: number;
      sequencia?: number;
      quantidade?: number;
      enderecoSugeridoId?: string;
      codigoUnitizador?: string;
    }>;
    paletesBipadosValidados?: PaleteBipadoValidadoFinalizacao[];
  },
) {
  return apiRequest<FinalizarRecebimentoComEtiquetas>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/finalizar`,
    {
      method: 'PUT',
      body: JSON.stringify(payload ?? {}),
    },
  );
}

export function previewPaletesArmazenagemRecebimento(
  recebimentoId: string,
  payload: { paletes: Array<{ produtoId: string; qtdPaletes: number }> },
) {
  return apiRequest<PreviewPaletesArmazenagem>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/armazenagem/preview-paletes`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function previewEnderecosPaletesBipadosRecebimento(recebimentoId: string) {
  return apiRequest<PreviewPaletesBipados>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/armazenagem/preview-paletes-bipados`,
  );
}

export function sugerirEtiquetasRecebimento(recebimentoId: string) {
  return apiRequest<SugestaoEtiquetasRecebimento>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/etiquetas/sugestao`,
  );
}

export async function imprimirEtiquetasRecebimento(
  recebimentoId: string,
  etiquetas: EtiquetaPaleteGerada[],
) {
  const { blob, filename } = await apiDownloadBlob(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/etiquetas/imprimir`,
    {
      method: 'POST',
      body: JSON.stringify({ etiquetas }),
    },
  );

  downloadBlobArquivo(blob, filename);

  return { filename };
}

export async function reimprimirEtiquetasRecebimento(recebimentoId: string) {
  const { blob, filename } = await apiDownloadBlob(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/etiquetas/imprimir`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );

  downloadBlobArquivo(blob, filename);

  return { filename };
}

export function reabrirConferencia(recebimentoId: string) {
  return apiRequest<RecebimentoApi>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/reabrir`,
    { method: 'PUT' },
  );
}

export async function fetchChecklist(
  recebimentoId: string,
): Promise<ChecklistRecebimentoApi | null> {
  try {
    return await apiRequest<ChecklistRecebimentoApi>(
      `/recebimentos/${encodeURIComponent(recebimentoId)}/checklist`,
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null;
    }

    throw error;
  }
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
  const result = await apiRequest<{ items: DocumentoApi[] }>(
    `/documentos?${params.toString()}`,
  );
  return result.items ?? [];
}

export async function getDocumentDownloadUrl(
  documentoId: string,
): Promise<string> {
  const result = await apiRequest<{ downloadUrl: string }>(
    `/documentos/${encodeURIComponent(documentoId)}/url`,
  );
  return result.downloadUrl;
}

export async function listAvarias(
  recebimentoId: string,
): Promise<RecebimentoAvariaApi[]> {
  const result = await apiRequest<{ items: RecebimentoAvariaApi[] }>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/avarias`,
  );
  return result.items ?? [];
}

export async function listAvariaDocumentos(
  recebimentoId: string,
): Promise<DocumentoApi[]> {
  const params = new URLSearchParams({
    entidadeTipo: 'recebimento_avaria',
    entidadeId: recebimentoId,
    status: 'ativo',
    page: '1',
    limit: '50',
  });
  const result = await apiRequest<{ items: DocumentoApi[] }>(
    `/documentos?${params.toString()}`,
  );
  return result.items ?? [];
}

export async function gerarLinkRastreio(
  preRecebimentoId: string,
  regenerar = false,
): Promise<GerarLinkRastreioResponse> {
  return apiRequest<GerarLinkRastreioResponse>(
    `/pre-recebimentos/${encodeURIComponent(preRecebimentoId)}/gerar-link-rastreio`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regenerar }),
    },
  );
}

export type ImportOfflineRecebimentoPayload = {
  exportId: string;
  unidadeId?: string;
  entries: Array<{
    outboxId?: number;
    label: string;
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    payload: unknown;
    createdAt: number;
    photoRefs?: Array<{
      photoId: number;
      outboxId: number;
      filename: string;
      mimeType: string;
      relatedId: string;
    }>;
  }>;
};

export type ImportOfflineRecebimentoResult = {
  demandId: string;
  recebimentoId: string;
  exportId: string;
  appliedCount: number;
  skippedCount: number;
  errors: Array<{ label: string; message: string }>;
};

export function importOfflineRecebimento(
  preRecebimentoId: string,
  payload: ImportOfflineRecebimentoPayload,
) {
  return apiRequest<ImportOfflineRecebimentoResult>(
    `/pre-recebimentos/${encodeURIComponent(preRecebimentoId)}/offline/importar`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}
