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
  createdAt: string;
  updatedAt: string;
};

export type ProcessoDebitoItem = {
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

export type CobrancaEvento = {
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

export type ProcessoDebitoEvidencia = {
  id: string;
  avariaId: string;
  tipo: string;
  natureza: string | null;
  photoUrls: string[];
  createdAt: string;
};

export type ProcessoDebitoNotaFiscal = {
  id: string;
  numeroNf: string;
  tipo: 'reentrega' | 'devolucao_parcial' | 'devolucao_total';
  cliente: string | null;
  transporteId: string | null;
};

export type ProcessoDebitoTransporte = {
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

export type ProcessoDebitoDemanda = {
  placa: string | null;
  doca: string | null;
  cargaSegregada: boolean;
  paletesEsperados: number | null;
};

export type ProcessoDebitoInteracao = {
  id: string;
  processoDebitoId: string;
  autor: InteracaoAutor;
  tipo: InteracaoTipo;
  descricao: string;
  anexoChaves: string[];
  anexoUrls: string[];
  transportadoraId: string | null;
  criadoPorUserId: number | null;
  createdAt: string;
};

/** @deprecated Use ProcessoDebitoInteracao */
export type ProcessoDebitoReplica = ProcessoDebitoInteracao;

export type ProcessoDebitoDetalhe = {
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
  itens: ProcessoDebitoItem[];
  eventos: CobrancaEvento[];
  transporte: ProcessoDebitoTransporte | null;
  demanda: ProcessoDebitoDemanda;
  notasFiscais: ProcessoDebitoNotaFiscal[];
  evidencias: ProcessoDebitoEvidencia[];
  registrosCorte: Array<{
    id: string;
    codigo: string;
    rota: string;
    doca: string | null;
    totalVolumes: number | null;
    pesoTotalKg: number | null;
    separadorNome: string | null;
    status: string;
    solicitadoEm: string;
  }>;
  mapaSeparacao: {
    codigo: string;
    geradoEm: string | null;
    totalItens: number;
    totalVolumes: number;
  } | null;
  interacoes: ProcessoDebitoInteracao[];
};

export type DebitoFiltroStatus = 'abertos' | 'em_analise' | 'encerrados' | 'todos';

export const DEBITO_STATUS_LABELS: Record<ProcessoDebitoStatus, string> = {
  aberto: 'Aberto',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  incluido_em_documento: 'Incluído em documento',
  cancelado: 'Cancelado',
};

export const INTERACAO_TIPO_TRANSPORTADORA_LABELS: Record<
  InteracaoTipoTransportadora,
  string
> = {
  erro_conferencia: 'Erro na conferência',
  nf_incorreta: 'Nota fiscal incorreta',
  avaria_nao_procedente: 'Avaria não procedente',
  envio_documento: 'Envio de documento',
  esclarecimento: 'Esclarecimento',
  outros: 'Outros',
};

export const INTERACAO_TIPO_CD_LABELS: Record<InteracaoTipoCd, string> = {
  solicitacao_prova: 'Solicitação de prova',
  parecer: 'Parecer do CD',
  observacao_cd: 'Observação do CD',
};

export const INTERACAO_TIPO_LABELS: Record<InteracaoTipo, string> = {
  ...INTERACAO_TIPO_TRANSPORTADORA_LABELS,
  ...INTERACAO_TIPO_CD_LABELS,
};

/** @deprecated Use INTERACAO_TIPO_TRANSPORTADORA_LABELS */
export const TIPO_CONTESTACAO_LABELS = INTERACAO_TIPO_TRANSPORTADORA_LABELS;

export const INTERACAO_AUTOR_LABELS: Record<InteracaoAutor, string> = {
  transportadora: 'Transportadora',
  cd: 'Centro de Distribuição',
};

export const DEBITO_ITEM_TIPO_LABELS: Record<DebitoItemTipo, string> = {
  falta: 'Falta',
  avaria: 'Avaria',
  sobra: 'Sobra',
};

export function formatMoeda(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatData(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function podeEnviarInteracao(status: ProcessoDebitoStatus): boolean {
  return !['aprovado', 'incluido_em_documento', 'cancelado'].includes(status);
}

/** @deprecated Use podeEnviarInteracao */
export function podeEnviarReplica(status: ProcessoDebitoStatus): boolean {
  return podeEnviarInteracao(status);
}

export function temSolicitacaoProvaPendente(
  interacoes: ProcessoDebitoInteracao[],
): boolean {
  if (interacoes.length === 0) {
    return false;
  }

  const ultima = [...interacoes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  return ultima?.autor === 'cd' && ultima.tipo === 'solicitacao_prova';
}

export function proximoPassoDebito(
  status: ProcessoDebitoStatus,
  interacoes: ProcessoDebitoInteracao[] = [],
): string {
  if (temSolicitacaoProvaPendente(interacoes)) {
    return 'O CD solicitou provas adicionais. Envie sua resposta com os documentos.';
  }

  switch (status) {
    case 'aberto':
      return 'Envie sua contestação ou documentos para responder ao débito.';
    case 'em_analise':
      return 'Negociação em andamento. Aguarde ou responda às solicitações do CD.';
    case 'aprovado':
      return 'Processo aprovado e encerrado.';
    case 'incluido_em_documento':
      return 'Débito incluído em documento de cobrança.';
    case 'cancelado':
      return 'Processo cancelado.';
    default:
      return '';
  }
}
