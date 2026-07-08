import type {
  NaturezaSaldo,
  StatusSaldoEndereco,
  TipoMovimentoEstoque,
} from '@/features/estoque/types/estoque.api';

export type FiltroStatusSaldo = StatusSaldoEndereco | 'todos';

export type FiltroNaturezaSaldo = NaturezaSaldo | 'todos';

export type EstoqueProdutoAgrupadoItem = {
  produtoId: string;
  produtoSku: string;
  produtoDescricao: string;
  produtoGrupo: string | null;
  unidadeMedida: string;
  totalLotes: number;
  posicoes: number;
  validadeMaisProxima: string | null;
  saldoFisico: number;
  saldoBloqueado: number;
  saldoDebito: number;
  saldoReservado: number;
  saldoDisponivel: number;
  pesoLiquidoTotalKg: number | null;
  vencimentoProximo: boolean;
  updatedAt: string;
};

export type EstoqueLoteAgrupadoItem = {
  produtoId: string;
  produtoSku: string;
  produtoDescricao: string;
  produtoGrupo: string | null;
  lote: string;
  unidadeMedida: string;
  posicoes: number;
  validadeMaisProxima: string | null;
  saldoFisico: number;
  saldoBloqueado: number;
  saldoDebito: number;
  saldoReservado: number;
  saldoDisponivel: number;
  pesoLiquidoTotalKg: number | null;
  vencimentoProximo: boolean;
  updatedAt: string;
};

export type EstoqueListaItem = {
  saldoEnderecoId: string;
  produtoId: string;
  produtoSku: string;
  produtoDescricao: string;
  produtoGrupo: string | null;
  depositoId: string;
  depositoCodigo: string;
  depositoNome: string;
  enderecoId: string;
  enderecoMascarado: string;
  lote: string;
  numeroSerie: string;
  validade: string | null;
  unidadeMedida: string;
  saldoFisico: number;
  saldoBloqueado: number;
  saldoDebito: number;
  saldoReservado: number;
  saldoDisponivel: number;
  pesoLiquidoTotalKg: number | null;
  vencimentoProximo: boolean;
  updatedAt: string;
};

export type EstoqueSummary = {
  saldoFisico: number;
  saldoBloqueado: number;
  saldoDebito: number;
  saldoReservado: number;
  saldoDisponivel: number;
  pesoLiquidoTotalKg: number;
};

export type ExposicaoEstoque = {
  cncPendentes: number;
  cncEmAnalise: number;
  cncEmAbertoTotal: number;
  devolucaoDebitoEmAbertoValor: number;
};

export const STATUS_SALDO_LABELS: Record<StatusSaldoEndereco, string> = {
  liberado: 'Liberado',
  bloqueado: 'Bloqueado',
};

export const NATUREZA_SALDO_LABELS: Record<NaturezaSaldo, string> = {
  fisico: 'Físico',
  debito: 'Débito',
};

export type HistoricoProdutoSelecionado = {
  produtoId: string;
  produtoSku: string;
  produtoDescricao: string;
  lote: string;
  depositoId?: string;
  enderecoId?: string;
  enderecoMascarado?: string;
};

export type HistoricoMovimentacaoItem = {
  id: string;
  tipoMovimento: TipoMovimentoEstoque;
  quantidade: number;
  unidadeMedida: string;
  lote: string;
  validade: string | null;
  numeroSerie: string;
  natureza: NaturezaSaldo;
  documentoRef: string | null;
  motivo: string;
  operatorId: number | null;
  operatorNome: string | null;
  occurredAt: string;
  depositoOrigemId: string | null;
  depositoOrigemCodigo: string | null;
  depositoOrigemNome: string | null;
  depositoDestinoId: string | null;
  depositoDestinoCodigo: string | null;
  depositoDestinoNome: string | null;
  enderecoOrigemId: string | null;
  enderecoOrigemMascarado: string | null;
  enderecoDestinoId: string | null;
  enderecoDestinoMascarado: string | null;
};

export type SaldoDetalhe = {
  id: string;
  unidadeId: string;
  produtoId: string;
  produtoSku: string;
  produtoDescricao: string;
  produtoGrupo: string | null;
  depositoId: string;
  depositoCodigo: string;
  depositoNome: string;
  enderecoId: string;
  enderecoMascarado: string;
  lote: string;
  validade: string | null;
  numeroSerie: string;
  natureza: NaturezaSaldo;
  status: StatusSaldoEndereco;
  motivoBloqueio: {
    id: string;
    codigo: string;
    nome: string;
  } | null;
  observacaoBloqueio: string | null;
  bloqueadoEm: string | null;
  bloqueadoPor: number | null;
  quantidade: number;
  unidadeMedida: string;
  saldoReservado: number;
  updatedAt: string;
};

export const TIPO_MOVIMENTO_LABELS: Record<TipoMovimentoEstoque, string> = {
  ENTRADA: 'Entrada',
  SAIDA: 'Saída',
  TRANSFERENCIA_DEPOSITO: 'Transferência',
  AJUSTE: 'Ajuste',
  ESTORNO: 'Estorno',
};
