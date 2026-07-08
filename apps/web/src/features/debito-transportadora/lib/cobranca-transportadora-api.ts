import { apiRequest } from '@/lib/api';

export type ProcessoDebitoStatus =
  | 'aberto'
  | 'em_analise'
  | 'aprovado'
  | 'incluido_em_documento'
  | 'cancelado';

export type DebitoItemTipo = 'falta' | 'avaria' | 'sobra';

export type DebitoItemStatus =
  | 'pendente'
  | 'aprovado'
  | 'rejeitado'
  | 'cobrar'
  | 'nao_cobrar'
  | 'sobra';

export type DocumentoCobrancaStatus =
  | 'rascunho'
  | 'emitido'
  | 'enviado'
  | 'pago'
  | 'cancelado';

export type DevolucaoNotaFiscalTipoApi =
  | 'reentrega'
  | 'devolucao_parcial'
  | 'devolucao_total';

export type ProcessoDebitoListItemApi = {
  id: string;
  unidadeId: string;
  demandaId: string;
  codigoDemanda: string;
  transporteId: string | null;
  transportadoraId: string | null;
  transportadoraNome: string | null;
  status: ProcessoDebitoStatus;
  valorTotal: number;
  quantidadeItens: number;
  quantidadeItensFalta: number;
  quantidadeItensAvaria: number;
  createdAt: string;
  updatedAt: string;
};

export type ListarProcessosDebitoResponse = {
  processos: ProcessoDebitoListItemApi[];
};

export type ProcessoDebitoTransporteApi = {
  numeroTransporte: string;
  motorista: string | null;
  placa: string | null;
  perfilEsperado: string | null;
  perfilPagamentoNome: string | null;
  regiao: string | null;
  cidade: string | null;
  bairro: string | null;
  itinerario: string | null;
  status: string;
  mapaGeradoEm: string | null;
};

export type ProcessoDebitoDemandaApi = {
  placa: string | null;
  doca: string | null;
  cargaSegregada: boolean;
  paletesEsperados: number | null;
};

export type ProcessoDebitoNotaFiscalApi = {
  id: string;
  numeroNf: string;
  tipo: DevolucaoNotaFiscalTipoApi;
  cliente: string | null;
  transporteId: string | null;
};

export type ProcessoDebitoEvidenciaApi = {
  id: string;
  avariaId: string;
  tipo: string;
  natureza: string | null;
  photoUrls: string[];
  createdAt: string;
};

export type ProcessoDebitoRegistroCorteApi = {
  id: string;
  codigo: string;
  rota: string;
  doca: string | null;
  totalVolumes: number | null;
  pesoTotalKg: number | null;
  separadorNome: string | null;
  status: string;
  solicitadoEm: string;
};

export type ProcessoDebitoMapaSeparacaoApi = {
  codigo: string;
  geradoEm: string | null;
  totalItens: number;
  totalVolumes: number;
};

export type ProcessoDebitoItemApi = {
  id: string;
  processoDebitoId: string;
  demandaId: string;
  notaFiscalId: string | null;
  itemId: string | null;
  avariaId: string | null;
  faltaPesoId: string | null;
  tipo: DebitoItemTipo;
  sku: string | null;
  descricaoProduto: string | null;
  lote: string | null;
  qtdConferida: number | null;
  quantidade: number | null;
  qtdAnomalia: number;
  pesoKg: number | null;
  pesoTotalKg: number | null;
  valorUnitario: number | null;
  valorDebito: number;
  motivo: string | null;
  observacao: string | null;
  status: DebitoItemStatus;
  createdAt: string;
  updatedAt: string;
};

export type CobrancaEventoApi = {
  id: string;
  entidadeTipo: 'processo' | 'documento';
  entidadeId: string;
  statusAnterior: string | null;
  statusNovo: string;
  descricao: string | null;
  criadoPorUserId: number | null;
  criadoPorNome: string | null;
  createdAt: string;
};

export type ProcessoDebitoInteracaoApi = {
  id: string;
  processoDebitoId: string;
  autor: 'transportadora' | 'cd';
  tipo:
    | 'erro_conferencia'
    | 'nf_incorreta'
    | 'avaria_nao_procedente'
    | 'envio_documento'
    | 'esclarecimento'
    | 'outros'
    | 'solicitacao_prova'
    | 'parecer'
    | 'observacao_cd';
  descricao: string;
  anexoChaves: string[];
  anexoUrls: string[];
  transportadoraId: string | null;
  criadoPorUserId: number | null;
  createdAt: string;
};

export type BuscarProcessoDebitoResponse = {
  id: string;
  unidadeId: string;
  demandaId: string;
  codigoDemanda: string;
  transporteId: string | null;
  transportadoraId: string | null;
  transportadoraNome: string | null;
  status: ProcessoDebitoStatus;
  valorTotal: number;
  quantidadeItens: number;
  observacao: string | null;
  createdAt: string;
  updatedAt: string;
  itens: ProcessoDebitoItemApi[];
  eventos: CobrancaEventoApi[];
  transporte: ProcessoDebitoTransporteApi | null;
  demanda: ProcessoDebitoDemandaApi;
  notasFiscais: ProcessoDebitoNotaFiscalApi[];
  evidencias: ProcessoDebitoEvidenciaApi[];
  registrosCorte: ProcessoDebitoRegistroCorteApi[];
  mapaSeparacao: ProcessoDebitoMapaSeparacaoApi | null;
  interacoes: ProcessoDebitoInteracaoApi[];
};

export type DocumentoCobrancaListItemApi = {
  id: string;
  unidadeId: string;
  numeroDocumento: string;
  transportadoraId: string | null;
  transportadoraNome: string;
  status: DocumentoCobrancaStatus;
  valorTotal: number;
  quantidadeProcessos: number;
  quantidadeItens: number;
  emitidoEm: string | null;
  enviadoEm: string | null;
  pagoEm: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListarDocumentosCobrancaResponse = {
  documentos: DocumentoCobrancaListItemApi[];
};

export type ListarProcessosDebitoFilters = {
  status?: ProcessoDebitoStatus;
  transportadoraId?: string;
  demandaId?: string;
};

export function listarProcessosDebito(
  unidadeId: string,
  filters?: ListarProcessosDebitoFilters,
) {
  const params = new URLSearchParams({ unidadeId });

  if (filters?.status) {
    params.set('status', filters.status);
  }

  if (filters?.transportadoraId) {
    params.set('transportadoraId', filters.transportadoraId);
  }

  if (filters?.demandaId) {
    params.set('demandaId', filters.demandaId);
  }

  return apiRequest<ListarProcessosDebitoResponse>(
    `/cobranca-transportadora/processos?${params.toString()}`,
  );
}

export function buscarProcessoDebito(processoId: string, unidadeId: string) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<BuscarProcessoDebitoResponse>(
    `/cobranca-transportadora/processos/${processoId}?${params.toString()}`,
  );
}

export type ListarDocumentosCobrancaFilters = {
  status?: DocumentoCobrancaStatus;
  transportadoraId?: string;
};

export function listarDocumentosCobranca(
  unidadeId: string,
  filters?: ListarDocumentosCobrancaFilters,
) {
  const params = new URLSearchParams({ unidadeId });

  if (filters?.status) {
    params.set('status', filters.status);
  }

  if (filters?.transportadoraId) {
    params.set('transportadoraId', filters.transportadoraId);
  }

  return apiRequest<ListarDocumentosCobrancaResponse>(
    `/cobranca-transportadora/documentos?${params.toString()}`,
  );
}

export type DocumentoCobrancaItemApi = {
  id: string;
  documentoCobrancaId: string;
  processoDebitoId: string;
  processoDebitoItemId: string;
  valorDebito: number;
  demandaId: string;
  codigoDemanda: string;
  sku: string | null;
  tipo: DebitoItemTipo;
  createdAt: string;
};

export type BuscarDocumentoCobrancaResponse = {
  id: string;
  unidadeId: string;
  numeroDocumento: string;
  transportadoraId: string | null;
  transportadoraNome: string;
  status: DocumentoCobrancaStatus;
  valorTotal: number;
  quantidadeProcessos: number;
  quantidadeItens: number;
  observacao: string | null;
  emitidoEm: string | null;
  enviadoEm: string | null;
  pagoEm: string | null;
  createdAt: string;
  updatedAt: string;
  itens: DocumentoCobrancaItemApi[];
  eventos: CobrancaEventoApi[];
};

export type CriarDocumentoCobrancaBody = {
  unidadeId: string;
  transportadoraId?: string | null;
  transportadoraNome: string;
  processoDebitoIds: string[];
  observacao?: string;
};

export type CriarDocumentoCobrancaResponse = {
  id: string;
  numeroDocumento: string;
  status: DocumentoCobrancaStatus;
  valorTotal: number;
  quantidadeProcessos: number;
  quantidadeItens: number;
};

export type AtualizarStatusProcessoDebitoBody = {
  status: ProcessoDebitoStatus;
  observacao?: string;
};

export type AtualizarStatusProcessoDebitoResponse = {
  id: string;
  status: ProcessoDebitoStatus;
  statusAnterior: ProcessoDebitoStatus;
  updatedAt: string;
};

export type AtualizarStatusDocumentoCobrancaBody = {
  status: DocumentoCobrancaStatus;
  observacao?: string;
};

export type AtualizarStatusDocumentoCobrancaResponse = {
  id: string;
  status: DocumentoCobrancaStatus;
  statusAnterior: DocumentoCobrancaStatus;
  updatedAt: string;
  emitidoEm: string | null;
  enviadoEm: string | null;
  pagoEm: string | null;
};

export function buscarDocumentoCobranca(documentoId: string, unidadeId: string) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<BuscarDocumentoCobrancaResponse>(
    `/cobranca-transportadora/documentos/${documentoId}?${params.toString()}`,
  );
}

export function criarDocumentoCobranca(body: CriarDocumentoCobrancaBody) {
  return apiRequest<CriarDocumentoCobrancaResponse>(
    '/cobranca-transportadora/documentos',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export function atualizarStatusProcessoDebito(
  processoId: string,
  unidadeId: string,
  body: AtualizarStatusProcessoDebitoBody,
) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<AtualizarStatusProcessoDebitoResponse>(
    `/cobranca-transportadora/processos/${processoId}/status?${params.toString()}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
}

export function atualizarStatusDocumentoCobranca(
  documentoId: string,
  unidadeId: string,
  body: AtualizarStatusDocumentoCobrancaBody,
) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<AtualizarStatusDocumentoCobrancaResponse>(
    `/cobranca-transportadora/documentos/${documentoId}/status?${params.toString()}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
}

export type AtualizarItemProcessoDebitoBody = {
  valorUnitario?: number | null;
  valorDebito?: number;
  quantidade?: number;
  status?: DebitoItemStatus;
  observacao?: string | null;
};

export type AtualizarItemProcessoDebitoResponse = {
  id: string;
  processoDebitoId: string;
  valorDebito: number;
  status: DebitoItemStatus;
  valorTotalProcesso: number;
};

export type RemoverItemProcessoDebitoResponse = {
  id: string;
  processoDebitoId: string;
  valorTotalProcesso: number;
  quantidadeItens: number;
};

export function atualizarItemProcessoDebito(
  processoId: string,
  itemId: string,
  unidadeId: string,
  body: AtualizarItemProcessoDebitoBody,
) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<AtualizarItemProcessoDebitoResponse>(
    `/cobranca-transportadora/processos/${processoId}/itens/${itemId}?${params.toString()}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
}

export type AtualizarItensProcessoDebitoEmMassaItemBody = {
  itemId: string;
  valorUnitario?: number | null;
  valorDebito?: number;
  quantidade?: number;
  status?: DebitoItemStatus;
  observacao?: string | null;
};

export type AtualizarItensProcessoDebitoEmMassaBody = {
  itens: AtualizarItensProcessoDebitoEmMassaItemBody[];
};

export type AtualizarItensProcessoDebitoEmMassaResponse = {
  quantidadeItensAtualizados: number;
  valorTotalProcesso: number;
};

export function atualizarItensProcessoDebitoEmMassa(
  processoId: string,
  unidadeId: string,
  body: AtualizarItensProcessoDebitoEmMassaBody,
) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<AtualizarItensProcessoDebitoEmMassaResponse>(
    `/cobranca-transportadora/processos/${processoId}/itens/em-massa?${params.toString()}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
}

export function removerItemProcessoDebito(
  processoId: string,
  itemId: string,
  unidadeId: string,
) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<RemoverItemProcessoDebitoResponse>(
    `/cobranca-transportadora/processos/${processoId}/itens/${itemId}?${params.toString()}`,
    {
      method: 'DELETE',
    },
  );
}

export type InteracaoTipoCd =
  | 'solicitacao_prova'
  | 'parecer'
  | 'observacao_cd';

export type RegistrarInteracaoCdBody = {
  tipo: InteracaoTipoCd;
  descricao: string;
  anexoChaves: string[];
};

export type RegistrarInteracaoCdResponse = {
  id: string;
  processoDebitoId: string;
  autor: 'cd';
  tipo: InteracaoTipoCd;
  descricao: string;
  anexoChaves: string[];
  criadoPorUserId: number | null;
  createdAt: string;
  statusProcesso: ProcessoDebitoStatus;
};

export function registrarInteracaoCD(
  processoId: string,
  unidadeId: string,
  body: RegistrarInteracaoCdBody,
) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<RegistrarInteracaoCdResponse>(
    `/cobranca-transportadora/processos/${processoId}/interacao?${params.toString()}`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export function uploadInteracaoAnexoCD(
  processoDebitoId: string,
  unidadeId: string,
  arquivo: File,
) {
  const formData = new FormData();
  formData.append('processoDebitoId', processoDebitoId);
  formData.append('unidadeId', unidadeId);
  formData.append('arquivo', arquivo);

  return apiRequest<{ chave: string }>(
    '/cobranca-transportadora/upload-interacao',
    {
      method: 'POST',
      body: formData,
    },
  );
}
