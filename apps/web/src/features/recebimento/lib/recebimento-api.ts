import { apiRequest, ApiClientError } from '@/lib/api';

import type {
  ChecklistRecebimentoApi,
  CreatePreRecebimentoPayload,
  DocumentoApi,
  IniciarRecebimentoPayload,
  ListPreRecebimentosApiResponse,
  ListPreRecebimentosParams,
  PreRecebimentoApi,
  PreRecebimentoSituacaoApi,
  RecebimentoAvariaApi,
  RecebimentoApi,
} from '@/features/recebimento/types/recebimento.api';
import type {
  RecebimentoListaItem,
  RecebimentoStatus,
} from '@/features/recebimento/types/recebimento-lista.schema';

function mapSituacaoToStatus(
  situacao: PreRecebimentoSituacaoApi,
): RecebimentoStatus {
  switch (situacao) {
    case 'veiculo_chegou':
      return 'em-transito';
    case 'em_recebimento':
    case 'aguardando_aprovacao':
      return 'descarregando';
    case 'aprovado':
    case 'finalizado':
      return 'concluido';
    default:
      return 'agendado';
  }
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
  if (situacao !== 'agendado' && situacao !== 'veiculo_chegou') {
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
    placa: item.placa,
    transportador: item.transportadoraId,
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
  if (params.transportadoraId) {
    searchParams.set('transportadoraId', params.transportadoraId);
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

export function checkinVeiculo(preRecebimentoId: string) {
  return apiRequest<PreRecebimentoApi>(
    `/pre-recebimentos/${encodeURIComponent(preRecebimentoId)}/checkin`,
    { method: 'PUT' },
  );
}

export function iniciarRecebimento(payload: IniciarRecebimentoPayload) {
  return apiRequest<RecebimentoApi>('/recebimentos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function encerrarConferencia(recebimentoId: string) {
  return apiRequest<RecebimentoApi>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/encerrar`,
    { method: 'PUT' },
  );
}

export function aprovarRecebimento(recebimentoId: string) {
  return apiRequest<RecebimentoApi>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/aprovar`,
    { method: 'PUT' },
  );
}

export function finalizarRecebimento(recebimentoId: string) {
  return apiRequest<RecebimentoApi>(
    `/recebimentos/${encodeURIComponent(recebimentoId)}/finalizar`,
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
