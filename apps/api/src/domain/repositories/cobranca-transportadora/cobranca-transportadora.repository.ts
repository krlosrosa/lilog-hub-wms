export const COBRANCA_TRANSPORTADORA_REPOSITORY =
  'ICobrancaTransportadoraRepository';

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

export type CobrancaEventoEntidadeTipo = 'processo' | 'documento';

export type ProcessoDebitoItemInput = {
  demandaId: string;
  notaFiscalId?: string | null;
  itemId?: string | null;
  avariaId?: string | null;
  faltaPesoId?: string | null;
  tipo: DebitoItemTipo;
  sku?: string | null;
  descricaoProduto?: string | null;
  quantidade?: number | null;
  pesoKg?: number | null;
  valorUnitario?: number | null;
  valorDebito?: number;
  motivo?: string | null;
  observacao?: string | null;
};

export type CriarProcessoDebitoInput = {
  unidadeId: string;
  demandaId: string;
  transporteId?: string | null;
  transportadoraId?: string | null;
  transportadoraNome?: string | null;
  observacao?: string | null;
  criadoPorUserId?: number | null;
  itens: ProcessoDebitoItemInput[];
};

export type CriarProcessoDebitoResult = {
  id: string;
  demandaId: string;
  status: ProcessoDebitoStatus;
  quantidadeItens: number;
  valorTotal: number;
};

export type ListarProcessosFilter = {
  unidadeId: string;
  status?: ProcessoDebitoStatus;
  transportadoraId?: string;
  demandaId?: string;
};

export type ListarProcessosPortalFilter = {
  transportadoraId: string;
  unidadeId?: string;
  status?: ProcessoDebitoStatus;
};

export type InteracaoAutor = 'transportadora' | 'cd';

export type InteracaoTipoTransportadora =
  | 'erro_conferencia'
  | 'nf_incorreta'
  | 'avaria_nao_procedente'
  | 'envio_documento'
  | 'esclarecimento'
  | 'outros';

export type InteracaoTipoCd =
  | 'solicitacao_prova'
  | 'parecer'
  | 'observacao_cd';

export type InteracaoTipo = InteracaoTipoTransportadora | InteracaoTipoCd;

/** @deprecated Use InteracaoTipoTransportadora */
export type TipoContestacao = InteracaoTipoTransportadora;

export type CriarInteracaoInput = {
  processoDebitoId: string;
  autor: InteracaoAutor;
  tipo: InteracaoTipo;
  descricao: string;
  anexoChaves: string[];
  transportadoraId?: string | null;
  criadoPorUserId?: number | null;
  unidadeId?: string;
};

export type InteracaoRecord = {
  id: string;
  processoDebitoId: string;
  autor: InteracaoAutor;
  tipo: InteracaoTipo;
  descricao: string;
  anexoChaves: string[];
  transportadoraId: string | null;
  criadoPorUserId: number | null;
  createdAt: Date;
};

/** @deprecated Use CriarInteracaoInput */
export type CriarReplicaInput = {
  processoDebitoId: string;
  transportadoraId: string;
  tipoContestacao: TipoContestacao;
  descricao: string;
  anexoChaves: string[];
};

/** @deprecated Use InteracaoRecord */
export type ReplicaRecord = {
  id: string;
  processoDebitoId: string;
  transportadoraId: string;
  tipoContestacao: TipoContestacao;
  descricao: string;
  anexoChaves: string[];
  createdAt: Date;
};

export type ProcessoDebitoResumoPortal = {
  id: string;
  unidadeId: string;
  transportadoraId: string | null;
  status: ProcessoDebitoStatus;
};

export type ProcessoDebitoListItem = {
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
  createdAt: Date;
  updatedAt: Date;
};

export type ProcessoDebitoItemRecord = {
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
  createdAt: Date;
  updatedAt: Date;
};

export type CobrancaEventoRecord = {
  id: string;
  entidadeTipo: CobrancaEventoEntidadeTipo;
  entidadeId: string;
  statusAnterior: string | null;
  statusNovo: string;
  descricao: string | null;
  criadoPorUserId: number | null;
  criadoPorNome: string | null;
  createdAt: Date;
};

export type ProcessoDebitoTransporteRecord = {
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
  mapaGeradoEm: Date | null;
};

export type ProcessoDebitoDemandaRecord = {
  placa: string | null;
  doca: string | null;
  cargaSegregada: boolean;
  paletesEsperados: number | null;
};

export type DevolucaoNotaFiscalTipo =
  | 'reentrega'
  | 'devolucao_parcial'
  | 'devolucao_total';

export type ProcessoDebitoNotaFiscalRecord = {
  id: string;
  numeroNf: string;
  tipo: DevolucaoNotaFiscalTipo;
  cliente: string | null;
  transporteId: string | null;
};

export type ProcessoDebitoEvidenciaRecord = {
  id: string;
  avariaId: string;
  tipo: string;
  natureza: string | null;
  photoUrls: string[];
  createdAt: Date;
};

export type ProcessoDebitoRegistroCorteRecord = {
  id: string;
  codigo: string;
  rota: string;
  doca: string | null;
  totalVolumes: number | null;
  pesoTotalKg: number | null;
  separadorNome: string | null;
  status: string;
  solicitadoEm: Date;
};

export type ProcessoDebitoMapaSeparacaoRecord = {
  codigo: string;
  geradoEm: Date | null;
  totalItens: number;
  totalVolumes: number;
};

export type ProcessoDebitoDetalheRecord = {
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
  createdAt: Date;
  updatedAt: Date;
  itens: ProcessoDebitoItemRecord[];
  eventos: CobrancaEventoRecord[];
  transporte: ProcessoDebitoTransporteRecord | null;
  demanda: ProcessoDebitoDemandaRecord;
  notasFiscais: ProcessoDebitoNotaFiscalRecord[];
  evidencias: ProcessoDebitoEvidenciaRecord[];
  registrosCorte: ProcessoDebitoRegistroCorteRecord[];
  mapaSeparacao: ProcessoDebitoMapaSeparacaoRecord | null;
  interacoes: InteracaoRecord[];
};

export type AtualizarStatusProcessoInput = {
  processoId: string;
  unidadeId: string;
  status: ProcessoDebitoStatus;
  observacao?: string | null;
  criadoPorUserId?: number | null;
};

export type AtualizarStatusProcessoResult = {
  id: string;
  status: ProcessoDebitoStatus;
  statusAnterior: ProcessoDebitoStatus;
  updatedAt: Date;
};

export type AtualizarItemProcessoInput = {
  processoId: string;
  itemId: string;
  unidadeId: string;
  valorUnitario?: number | null;
  valorDebito?: number;
  quantidade?: number;
  status?: DebitoItemStatus;
  observacao?: string | null;
  criadoPorUserId?: number | null;
};

export type AtualizarItemProcessoResult = {
  id: string;
  processoDebitoId: string;
  valorDebito: number;
  status: DebitoItemStatus;
  valorTotalProcesso: number;
};

export type RemoverItemProcessoInput = {
  processoId: string;
  itemId: string;
  unidadeId: string;
  criadoPorUserId?: number | null;
};

export type RemoverItemProcessoResult = {
  id: string;
  processoDebitoId: string;
  valorTotalProcesso: number;
  quantidadeItens: number;
};

export type AtualizarItemProcessoEmMassaItemInput = {
  itemId: string;
  valorUnitario?: number | null;
  valorDebito?: number;
  quantidade?: number;
  status?: DebitoItemStatus;
  observacao?: string | null;
};

export type AtualizarItensProcessoEmMassaInput = {
  processoId: string;
  unidadeId: string;
  itens: AtualizarItemProcessoEmMassaItemInput[];
  criadoPorUserId?: number | null;
};

export type AtualizarItensProcessoEmMassaResult = {
  quantidadeItensAtualizados: number;
  valorTotalProcesso: number;
};

export type CriarDocumentoCobrancaInput = {
  unidadeId: string;
  transportadoraId?: string | null;
  transportadoraNome: string;
  processoDebitoIds: string[];
  observacao?: string | null;
  emitidoPorUserId?: number | null;
};

export type CriarDocumentoCobrancaResult = {
  id: string;
  numeroDocumento: string;
  status: DocumentoCobrancaStatus;
  valorTotal: number;
  quantidadeProcessos: number;
  quantidadeItens: number;
};

export type ListarDocumentosFilter = {
  unidadeId: string;
  status?: DocumentoCobrancaStatus;
  transportadoraId?: string;
};

export type DocumentoCobrancaListItem = {
  id: string;
  unidadeId: string;
  numeroDocumento: string;
  transportadoraId: string | null;
  transportadoraNome: string;
  status: DocumentoCobrancaStatus;
  valorTotal: number;
  quantidadeProcessos: number;
  quantidadeItens: number;
  emitidoEm: Date | null;
  enviadoEm: Date | null;
  pagoEm: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DocumentoCobrancaItemRecord = {
  id: string;
  documentoCobrancaId: string;
  processoDebitoId: string;
  processoDebitoItemId: string;
  valorDebito: number;
  demandaId: string;
  codigoDemanda: string;
  sku: string | null;
  tipo: DebitoItemTipo;
  createdAt: Date;
};

export type DocumentoCobrancaDetalheRecord = {
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
  emitidoEm: Date | null;
  enviadoEm: Date | null;
  pagoEm: Date | null;
  createdAt: Date;
  updatedAt: Date;
  itens: DocumentoCobrancaItemRecord[];
  eventos: CobrancaEventoRecord[];
};

export type AtualizarStatusDocumentoInput = {
  documentoId: string;
  unidadeId: string;
  status: DocumentoCobrancaStatus;
  observacao?: string | null;
  criadoPorUserId?: number | null;
};

export type AtualizarStatusDocumentoResult = {
  id: string;
  status: DocumentoCobrancaStatus;
  statusAnterior: DocumentoCobrancaStatus;
  updatedAt: Date;
  emitidoEm: Date | null;
  enviadoEm: Date | null;
  pagoEm: Date | null;
};

export type PortalNotificacaoTipo =
  | 'novo_debito'
  | 'status_atualizado'
  | 'nova_interacao';

export type CriarNotificacaoPortalInput = {
  transportadoraId: string;
  processoDebitoId?: string;
  tipo: PortalNotificacaoTipo;
  titulo: string;
  mensagem: string;
  rotaDestino: string;
};

export type NotificacaoPortalRecord = {
  id: string;
  tipo: PortalNotificacaoTipo;
  titulo: string;
  mensagem: string;
  rotaDestino: string;
  lida: boolean;
  createdAt: Date;
};

export interface ICobrancaTransportadoraRepository {
  buscarProcessoPorDemandaId(
    demandaId: string,
    unidadeId: string,
  ): Promise<ProcessoDebitoListItem | null>;

  criarProcessoDebito(
    input: CriarProcessoDebitoInput,
  ): Promise<CriarProcessoDebitoResult>;

  listarProcessos(
    filter: ListarProcessosFilter,
  ): Promise<ProcessoDebitoListItem[]>;

  buscarProcessoDetalhe(
    processoId: string,
    unidadeId: string,
  ): Promise<ProcessoDebitoDetalheRecord | null>;

  atualizarStatusProcesso(
    input: AtualizarStatusProcessoInput,
  ): Promise<AtualizarStatusProcessoResult | null>;

  atualizarItemProcesso(
    input: AtualizarItemProcessoInput,
  ): Promise<AtualizarItemProcessoResult | null>;

  atualizarItensProcessoEmMassa(
    input: AtualizarItensProcessoEmMassaInput,
  ): Promise<AtualizarItensProcessoEmMassaResult | null>;

  removerItemProcesso(
    input: RemoverItemProcessoInput,
  ): Promise<RemoverItemProcessoResult | null>;

  criarDocumentoCobranca(
    input: CriarDocumentoCobrancaInput,
  ): Promise<CriarDocumentoCobrancaResult>;

  listarDocumentos(
    filter: ListarDocumentosFilter,
  ): Promise<DocumentoCobrancaListItem[]>;

  buscarDocumentoDetalhe(
    documentoId: string,
    unidadeId: string,
  ): Promise<DocumentoCobrancaDetalheRecord | null>;

  atualizarStatusDocumento(
    input: AtualizarStatusDocumentoInput,
  ): Promise<AtualizarStatusDocumentoResult | null>;

  listarProcessosPortal(
    filter: ListarProcessosPortalFilter,
  ): Promise<ProcessoDebitoListItem[]>;

  buscarProcessoResumoPortal(
    processoId: string,
    transportadoraId: string,
  ): Promise<ProcessoDebitoResumoPortal | null>;

  criarInteracao(data: CriarInteracaoInput): Promise<InteracaoRecord>;

  listarInteracoes(processoDebitoId: string): Promise<InteracaoRecord[]>;

  criarNotificacaoPortal(input: CriarNotificacaoPortalInput): Promise<void>;

  listarNotificacoesPortal(
    transportadoraId: string,
    apenasNaoLidas?: boolean,
    limit?: number,
  ): Promise<{
    notificacoes: NotificacaoPortalRecord[];
    totalNaoLidas: number;
  }>;

  marcarNotificacoesLidas(
    ids: string[],
    transportadoraId: string,
  ): Promise<void>;
}
