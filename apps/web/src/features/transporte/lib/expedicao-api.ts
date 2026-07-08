import { apiRequest } from '@/lib/api';

import type { BreakdownQuantidade } from '@/features/transporte/types/transporte.schema';

export type UploadLoteResponse = {
  loteId: string;
  totalRemessas: number;
  totalTransportes: number;
  nomeArquivo: string;
  dataReferencia: string;
  createdAt: string;
};

export type UploadLotePayload = {
  unidadeId: string;
  arquivo: File;
  dataReferencia: string;
  horarioExpectativaSaida: string;
};

export type RemessaLinhaApiItem = {
  id: string;
  sku: string;
  descricao: string | null;
  produtoId: string | null;
  empresa: string;
  categoria: string;
  lote: string | null;
  dataFabricacao: string | null;
  faixa: string | null;
  peso: number | null;
  quantidade: number;
  unidadeMedida: string;
  quantidadeNormalizadaUnidades: number;
  breakdown: BreakdownQuantidade | null;
  unidadesPorCaixa: number | null;
  caixasPorPalete: number | null;
  pesoBrutoUnidade: string | null;
  pesoBrutoCaixa: string | null;
  pesoBrutoPalete: string | null;
  pesoLiquidoUnidade: string | null;
  pesoLiquidoCaixa: string | null;
  pesoLiquidoPalete: string | null;
};

export type RemessaTransporteApiItem = {
  id: string;
  remessa: string;
  empresa: string;
  codCliente: string;
  cliente: string;
  cidade: string;
  peso: number;
  volume: number;
  origem?: 'upload' | 'reentrega';
  motivoReentrega?: string | null;
  itinerario?: string | null;
  itinerarioId?: string | null;
  itens: RemessaLinhaApiItem[];
};

export type TransporteApiItem = {
  id: string;
  uploadLoteId: string;
  rota: string;
  regiao: string | null;
  cidade: string | null;
  bairro: string | null;
  dataTransporte: string;
  horarioExpectativaSaida: string | null;
  pesoTotal: number;
  volumeTotal: number;
  distanciaKm: number | null;
  itinerario: string | null;
  itinerarioId?: string | null;
  perfilEsperado: 'VUC' | 'Toco' | 'Truck_3_4' | 'Carreta' | 'Bitrem' | null;
  status: 'PENDENTE' | 'ALOCADO' | 'PARCIAL';
  placa: string | null;
  motorista: string | null;
  transportadora: string | null;
  perfilPagamentoId: string | null;
  perfilPagamentoNome: string | null;
  custoPrevisto: number | null;
  freteSemCusto: boolean;
  reentregaExclusiva: boolean;
  isPrioridade: boolean;
  nivelPrioridade: 'urgente' | 'prioritaria' | 'normal' | 'baixa' | null;
  mapaGeradoEm: string | null;
  ultimoMapaLoteId: string | null;
  temMapaConferenciaReentrega: boolean;
  quantidadeRemessas: number;
  remessas: RemessaTransporteApiItem[];
};

export type ListTransportesResponse = {
  transportes: TransporteApiItem[];
};

export type SalvarAlocacaoTransportePayload = {
  transporteId: string;
  placaTransportadoraId: string;
  placa: string;
  transportadora: string;
  motorista?: string | null;
  perfilTarifaId?: string | null;
  perfilTarifaNome?: string | null;
  perfilPagamentoId?: string | null;
  perfilPagamentoNome?: string | null;
  semCusto?: boolean;
  itinerario?: string | null;
  nivelPrioridade?: 'urgente' | 'prioritaria' | 'normal' | 'baixa' | null;
  horarioExpectativaSaida?: string | null;
  cidade?: string;
  bairro?: string | null;
  isPrioridade?: boolean;
  custoPrevisto?: number | null;
};

export type SalvarAlocacoesTransportesPayload = {
  unidadeId: string;
  alocacoes: SalvarAlocacaoTransportePayload[];
};

export type SalvarAlocacoesTransportesResponse = {
  atualizados: number;
  pulados?: number;
};

export type RotaConflitanteUpload = {
  rota: string;
  transporteId: string;
  status: string;
  ultimoMapaLoteId: string | null;
};

export type ExcluirTransporteResponse = {
  id: string;
  rota: string;
};

export type AtualizarPrioridadeTransportePayload = {
  unidadeId: string;
  isPrioridade: boolean;
  nivelPrioridade?: 'urgente' | 'prioritaria' | 'normal' | 'baixa';
};

export type AtualizarPrioridadeTransporteResponse = {
  id: string;
  rota: string;
  isPrioridade: boolean;
  nivelPrioridade: 'urgente' | 'prioritaria' | 'normal' | 'baixa' | null;
};

export function parseUploadConflitoBody(
  body: unknown,
): RotaConflitanteUpload[] | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const payload = body as Record<string, unknown>;
  const nested =
    typeof payload.message === 'object' && payload.message !== null
      ? (payload.message as Record<string, unknown>)
      : payload;

  const rotas = nested.rotasConflitantes;

  if (!Array.isArray(rotas)) {
    return null;
  }

  return rotas.filter(
    (item): item is RotaConflitanteUpload =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as RotaConflitanteUpload).rota === 'string' &&
      typeof (item as RotaConflitanteUpload).transporteId === 'string',
  );
}

export function uploadLoteRemessas(payload: UploadLotePayload) {
  const formData = new FormData();
  formData.append('arquivo', payload.arquivo);
  formData.append('unidadeId', payload.unidadeId);
  formData.append('dataReferencia', payload.dataReferencia);
  formData.append('horarioExpectativaSaida', payload.horarioExpectativaSaida);

  return apiRequest<UploadLoteResponse>('/expedicao/upload-lotes', {
    method: 'POST',
    body: formData,
  });
}

export type AtualizarItinerarioRemessasPayload = {
  itinerarios: { remessa: string; itinerario: string }[];
};

export type AtualizarItinerarioRemessasResponse = {
  atualizados: number;
  naoEncontrados: number;
};

export function atualizarItinerarioRemessas(
  uploadLoteId: string,
  payload: AtualizarItinerarioRemessasPayload,
) {
  return apiRequest<AtualizarItinerarioRemessasResponse>(
    `/expedicao/upload-lotes/${uploadLoteId}/remessas/itinerario`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function listTransportes(unidadeId: string) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<ListTransportesResponse>(
    `/expedicao/transportes?${params.toString()}`,
  );
}

export function salvarAlocacoesTransportes(
  payload: SalvarAlocacoesTransportesPayload,
) {
  return apiRequest<SalvarAlocacoesTransportesResponse>(
    '/expedicao/transportes/alocacoes',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function deleteTransporte(id: string, unidadeId: string) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<ExcluirTransporteResponse>(
    `/expedicao/transportes/${id}?${params.toString()}`,
    {
      method: 'DELETE',
    },
  );
}

export function atualizarPrioridadeTransporte(
  id: string,
  payload: AtualizarPrioridadeTransportePayload,
) {
  return apiRequest<AtualizarPrioridadeTransporteResponse>(
    `/expedicao/transportes/${id}/prioridade`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export type DevolucaoNfElegivelApiItem = {
  id: string;
  numeroNf: string;
  tipo: 'reentrega' | 'devolucao_parcial' | 'devolucao_total';
  codCliente: string | null;
  cliente: string | null;
  motivo: string;
  transporteOrigemId: string | null;
  pesoTotal: number;
  quantidadeItens: number;
};

export type ListNfsDevolucaoElegiveisResponse = {
  notasFiscais: DevolucaoNfElegivelApiItem[];
  remessasReentregaVinculadas: number;
};

export function listNfsDevolucaoElegiveis(
  transporteId: string,
  unidadeId: string,
  intervalo: { dataInicio: string; dataFim: string },
) {
  const params = new URLSearchParams({
    unidadeId,
    dataInicio: intervalo.dataInicio,
    dataFim: intervalo.dataFim,
  });

  return apiRequest<ListNfsDevolucaoElegiveisResponse>(
    `/expedicao/transportes/${encodeURIComponent(transporteId)}/nfs-devolucao-elegiveis?${params.toString()}`,
  );
}

export type VincularNfsDevolucaoPayload = {
  unidadeId: string;
  nfIds: string[];
};

export type VincularNfsDevolucaoResponse = {
  remessasCriadas: number;
  remessaIds: string[];
};

export function vincularNfsDevolucaoTransporte(
  transporteId: string,
  payload: VincularNfsDevolucaoPayload,
) {
  return apiRequest<VincularNfsDevolucaoResponse>(
    `/expedicao/transportes/${encodeURIComponent(transporteId)}/vincular-nfs-devolucao`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export type DesvincularNfsDevolucaoPayload = {
  unidadeId: string;
  remessaIds: string[];
};

export type DesvincularNfsDevolucaoResponse = {
  remessasDesvinculadas: number;
  remessaIds: string[];
};

export function desvincularNfsDevolucaoTransporte(
  transporteId: string,
  payload: DesvincularNfsDevolucaoPayload,
) {
  return apiRequest<DesvincularNfsDevolucaoResponse>(
    `/expedicao/transportes/${encodeURIComponent(transporteId)}/desvincular-nfs-devolucao`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export type ExcluirMapaConferenciaReentregaResponse = {
  transporteId: string;
  loteIdsExcluidos: string[];
};

export function excluirMapaConferenciaReentregaTransporte(
  transporteId: string,
  unidadeId: string,
) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<ExcluirMapaConferenciaReentregaResponse>(
    `/expedicao/transportes/${encodeURIComponent(transporteId)}/mapa-conferencia-reentrega?${params.toString()}`,
    {
      method: 'DELETE',
    },
  );
}
