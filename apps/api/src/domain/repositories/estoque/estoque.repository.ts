import type {
  Deposito,
  DepositoCodigo,
  DepositoFinalidade,
} from '../../model/estoque/deposito.model.js';
import type {
  ConsumirReservaInput,
  CriarReservaInput,
  LiberarReservaInput,
  ReservaEstoque,
} from '../../model/estoque/reserva-estoque.model.js';
import type { SaldoEndereco, StatusSaldoEndereco } from '../../model/estoque/saldo-endereco.model.js';
import type { NaturezaSaldo } from '../../model/estoque/saldo.model.js';

export const ESTOQUE_REPOSITORY = 'IEstoqueRepository';

export type ListSaldosEnderecoFilter = {
  unidadeId: string;
  depositoId?: string;
  enderecoId?: string;
  enderecoIds?: string[];
  produtoId?: string;
  lote?: string;
  status?: StatusSaldoEndereco;
  natureza?: NaturezaSaldo;
};

export type SaldoEnderecoComProduto = SaldoEndereco & {
  produtoSku: string;
  produtoNome: string;
  produtoGrupo: string | null;
  depositoCodigo: string;
  depositoNome: string;
  unidadesPorCaixa: number | null;
};

export type SaldoEnderecoDetalhe = SaldoEnderecoComProduto & {
  saldoReservado: number;
};

export type AjustarSaldoEnderecoInput = {
  saldoEnderecoId: string;
  novaQuantidade: number;
  motivo: string;
  operatorId?: number | null;
};

export type TransferirSaldoEnderecoInput = {
  saldoEnderecoId: string;
  enderecoDestinoId: string;
  quantidade: number;
  observacao?: string | null;
  operatorId?: number | null;
};

export type ListDisponibilidadeEstoqueFilter = {
  unidadeId: string;
  produtoId?: string;
  depositoId?: string;
  enderecoId?: string;
  status?: StatusSaldoEndereco;
  natureza?: NaturezaSaldo;
  lote?: string;
  grupos?: string[];
  search?: string;
  page?: number;
  limit?: number;
};

export type DisponibilidadeEstoqueItem = {
  saldoEnderecoId?: string;
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
  validade: Date | null;
  unidadeMedida: string;
  saldoFisico: number;
  saldoBloqueado: number;
  saldoDebito: number;
  saldoReservado: number;
  saldoDisponivel: number;
  pesoLiquidoTotalKg: number | null;
  vencimentoProximo: boolean;
  updatedAt: Date;
};

export type DisponibilidadeEstoqueSummary = {
  saldoFisico: number;
  saldoBloqueado: number;
  saldoDebito: number;
  saldoReservado: number;
  saldoDisponivel: number;
  pesoLiquidoTotalKg: number;
};

export type ListDisponibilidadeEstoqueResult = {
  items: DisponibilidadeEstoqueItem[];
  total: number;
  page: number;
  limit: number;
  summary: DisponibilidadeEstoqueSummary;
};

export type DisponibilidadeEstoqueAgrupadoGroupBy = 'produto' | 'lote';

export type ListDisponibilidadeEstoqueAgrupadoFilter = {
  unidadeId: string;
  produtoId?: string;
  depositoId?: string;
  status?: StatusSaldoEndereco;
  natureza?: NaturezaSaldo;
  lote?: string;
  grupos?: string[];
  search?: string;
  groupBy?: DisponibilidadeEstoqueAgrupadoGroupBy;
  page?: number;
  limit?: number;
};

export type DisponibilidadeEstoqueAgrupadoItem = {
  produtoId: string;
  produtoSku: string;
  produtoDescricao: string;
  produtoGrupo: string | null;
  lote: string;
  totalLotes?: number;
  unidadeMedida: string;
  posicoes: number;
  validadeMaisProxima: Date | null;
  saldoFisico: number;
  saldoBloqueado: number;
  saldoDebito: number;
  saldoReservado: number;
  saldoDisponivel: number;
  pesoLiquidoTotalKg: number | null;
  vencimentoProximo: boolean;
  updatedAt: Date;
};

export type ListDisponibilidadeEstoqueAgrupadoResult = {
  items: DisponibilidadeEstoqueAgrupadoItem[];
  total: number;
  page: number;
  limit: number;
  summary: DisponibilidadeEstoqueSummary;
};

export type ListReservasAtivasFilter = {
  unidadeId: string;
  produtoId?: string;
  depositoId?: string;
  enderecoId?: string;
  documentoRef?: string;
};

export type SaldoDisponivelFilter = {
  unidadeId: string;
  produtoId: string;
  depositoId: string;
  lote?: string;
  numeroSerie?: string;
};

export type CreateDepositoInput = {
  unidadeId: string;
  codigo: string;
  nome: string;
  finalidade: DepositoFinalidade;
  permiteVenda: boolean;
  permitePicking: boolean;
  exigeEndereco: boolean;
  contaDisponivel: boolean;
};

export type UpdateDepositoInput = {
  nome?: string;
  permiteVenda?: boolean;
  permitePicking?: boolean;
  exigeEndereco?: boolean;
  contaDisponivel?: boolean;
  ativo?: boolean;
};

export type EnsureEnderecoVirtualDepositoInput = {
  unidadeId: string;
  depositoCodigo: string;
};

export type EnderecoVirtualDepositoRecord = {
  id: string;
  enderecoMascarado: string;
};

export type UpsertSaldoEnderecoInput = {
  unidadeId: string;
  produtoId: string;
  depositoId: string;
  enderecoId: string;
  lote?: string | null;
  validade?: Date | null;
  numeroSerie?: string | null;
  natureza?: NaturezaSaldo;
  status?: StatusSaldoEndereco;
  motivoBloqueioId?: string | null;
  observacaoBloqueio?: string | null;
  bloqueadoPor?: number | null;
  quantidadeDelta: number;
  unidadeMedida: string;
};

export type BloquearSaldoEnderecoInput = {
  saldoEnderecoId: string;
  motivoBloqueioId: string;
  quantidade?: number;
  observacao?: string | null;
  operatorId?: number | null;
};

export type DesbloquearSaldoEnderecoInput = {
  saldoEnderecoId: string;
  observacao?: string | null;
  operatorId?: number | null;
};

export type TipoMovimentoEstoque =
  | 'ENTRADA'
  | 'SAIDA'
  | 'TRANSFERENCIA_DEPOSITO'
  | 'AJUSTE'
  | 'ESTORNO';

export type RegistrarMovimentacaoEstoqueInput = {
  unidadeId: string;
  produtoId: string;
  depositoOrigemId?: string | null;
  depositoDestinoId?: string | null;
  enderecoOrigemId?: string | null;
  enderecoDestinoId?: string | null;
  tipoMovimento: TipoMovimentoEstoque;
  quantidade: number;
  unidadeMedida: string;
  lote?: string | null;
  validade?: Date | null;
  numeroSerie?: string | null;
  natureza?: NaturezaSaldo;
  documentoRef?: string | null;
  motivo: string;
  operatorId?: number | null;
  occurredAt?: Date;
};

export type MovimentacaoEstoqueRecord = {
  id: string;
};

export type ListHistoricoProdutoFilter = {
  unidadeId: string;
  produtoId: string;
  lote?: string;
  depositoId?: string;
  enderecoId?: string;
  page?: number;
  limit?: number;
};

export type HistoricoMovimentacaoItem = {
  id: string;
  tipoMovimento: TipoMovimentoEstoque;
  quantidade: number;
  unidadeMedida: string;
  lote: string;
  validade: Date | null;
  numeroSerie: string;
  natureza: NaturezaSaldo;
  documentoRef: string | null;
  motivo: string;
  operatorId: number | null;
  operatorNome: string | null;
  occurredAt: Date;
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

export type ListHistoricoProdutoResult = {
  items: HistoricoMovimentacaoItem[];
  total: number;
  page: number;
  limit: number;
};

export interface IEstoqueRepository {
  ensureDepositosUnidade(unidadeId: string): Promise<Deposito[]>;
  findDepositoByCodigo(
    unidadeId: string,
    codigo: DepositoCodigo,
  ): Promise<Deposito | null>;
  findDepositoByUnidadeAndCodigo(
    unidadeId: string,
    codigo: string,
  ): Promise<Deposito | null>;
  listDepositos(unidadeId: string): Promise<Deposito[]>;
  findDepositoById(id: string): Promise<Deposito | null>;
  createDeposito(input: CreateDepositoInput): Promise<Deposito>;
  updateDeposito(id: string, data: UpdateDepositoInput): Promise<Deposito | null>;
  listSaldosEndereco(
    filter: ListSaldosEnderecoFilter,
  ): Promise<SaldoEnderecoComProduto[]>;
  findSaldoEnderecoById(id: string): Promise<SaldoEnderecoDetalhe | null>;
  ajustarSaldoEndereco(input: AjustarSaldoEnderecoInput): Promise<SaldoEndereco>;
  transferirSaldoEndereco(
    input: TransferirSaldoEnderecoInput,
  ): Promise<SaldoEndereco>;
  listDisponibilidadeEstoque(
    filter: ListDisponibilidadeEstoqueFilter,
  ): Promise<ListDisponibilidadeEstoqueResult>;
  listDisponibilidadeEstoqueAgrupado(
    filter: ListDisponibilidadeEstoqueAgrupadoFilter,
  ): Promise<ListDisponibilidadeEstoqueAgrupadoResult>;
  listGruposDisponibilidadeEstoque(unidadeId: string): Promise<string[]>;
  criarReserva(input: CriarReservaInput): Promise<ReservaEstoque>;
  liberarReserva(input: LiberarReservaInput): Promise<ReservaEstoque>;
  consumirReserva(input: ConsumirReservaInput): Promise<ReservaEstoque>;
  listReservasAtivas(filter: ListReservasAtivasFilter): Promise<ReservaEstoque[]>;
  getSaldoDisponivel(filter: SaldoDisponivelFilter): Promise<number>;
  ensureEnderecoVirtualDeposito(
    input: EnsureEnderecoVirtualDepositoInput,
  ): Promise<EnderecoVirtualDepositoRecord>;
  upsertSaldoEndereco(input: UpsertSaldoEnderecoInput): Promise<SaldoEndereco>;
  bloquearSaldoEndereco(input: BloquearSaldoEnderecoInput): Promise<SaldoEndereco>;
  desbloquearSaldoEndereco(
    input: DesbloquearSaldoEnderecoInput,
  ): Promise<SaldoEndereco>;
  existsMovimentacaoByDocumentoRef(documentoRef: string): Promise<boolean>;
  registrarMovimentacaoEstoque(
    input: RegistrarMovimentacaoEstoqueInput,
  ): Promise<MovimentacaoEstoqueRecord>;
  listHistoricoProduto(
    filter: ListHistoricoProdutoFilter,
  ): Promise<ListHistoricoProdutoResult>;
}
