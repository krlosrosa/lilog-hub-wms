export type StatusSaldoEndereco = 'liberado' | 'bloqueado';

export type NaturezaSaldo = 'fisico' | 'debito';

export type DisponibilidadeEstoqueItemApi = {
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

export type DisponibilidadeEstoqueSummaryApi = {
  saldoFisico: number;
  saldoBloqueado: number;
  saldoDebito: number;
  saldoReservado: number;
  saldoDisponivel: number;
  pesoLiquidoTotalKg: number;
};

export type DisponibilidadeEstoqueAgrupadoItemApi = {
  produtoId: string;
  produtoSku: string;
  produtoDescricao: string;
  produtoGrupo: string | null;
  lote: string;
  totalLotes?: number;
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

export type ListDisponibilidadeEstoqueAgrupadoApiResponse = {
  items: DisponibilidadeEstoqueAgrupadoItemApi[];
  total: number;
  page: number;
  limit: number;
  summary: DisponibilidadeEstoqueSummaryApi;
};

export type ListDisponibilidadeEstoqueAgrupadoParams = {
  unidadeId: string;
  produtoId?: string;
  depositoId?: string;
  status?: StatusSaldoEndereco;
  natureza?: NaturezaSaldo;
  lote?: string;
  grupos?: string[];
  search?: string;
  groupBy?: 'produto' | 'lote';
  page?: number;
  limit?: number;
};

export type ListDisponibilidadeEstoqueApiResponse = {
  items: DisponibilidadeEstoqueItemApi[];
  total: number;
  page: number;
  limit: number;
  summary: DisponibilidadeEstoqueSummaryApi;
};

export type ListDisponibilidadeEstoqueParams = {
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

export type ExposicaoEstoqueApi = {
  cncPendentes: number;
  cncEmAnalise: number;
  cncEmAbertoTotal: number;
  devolucaoDebitoEmAbertoValor: number;
};

export type TipoMovimentoEstoque =
  | 'ENTRADA'
  | 'SAIDA'
  | 'TRANSFERENCIA_DEPOSITO'
  | 'AJUSTE'
  | 'ESTORNO';

export type HistoricoMovimentacaoItemApi = {
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

export type ListHistoricoProdutoApiResponse = {
  items: HistoricoMovimentacaoItemApi[];
  total: number;
  page: number;
  limit: number;
};

export type ListHistoricoProdutoParams = {
  unidadeId: string;
  produtoId: string;
  lote?: string;
  depositoId?: string;
  enderecoId?: string;
  page?: number;
  limit?: number;
};

export type SaldoEnderecoItemApi = {
  id: string;
  unidadeId: string;
  produtoId: string;
  depositoId: string;
  enderecoId: string;
  enderecoMascarado?: string;
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
  updatedAt: string;
};

export type ListSaldosEnderecoApiResponse = {
  items: SaldoEnderecoComProdutoApi[];
};

export type SaldoEnderecoComProdutoApi = SaldoEnderecoItemApi & {
  produtoSku: string;
  produtoNome: string;
  produtoGrupo: string | null;
  depositoCodigo: string;
  depositoNome: string;
};

export type ListSaldosEnderecoParams = {
  unidadeId: string;
  depositoId?: string;
  enderecoId?: string;
  enderecoIds?: string[];
  produtoId?: string;
  lote?: string;
  status?: StatusSaldoEndereco;
};

export type SaldoEnderecoDetalheApi = SaldoEnderecoItemApi & {
  produtoSku: string;
  produtoDescricao: string;
  produtoGrupo: string | null;
  depositoCodigo: string;
  depositoNome: string;
  saldoReservado: number;
};

export type MotivoBloqueioSaldoApi = {
  id: string;
  unidadeId: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  origem: string;
  ativo: boolean;
  sistema: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ListMotivosBloqueioSaldoApiResponse = {
  items: MotivoBloqueioSaldoApi[];
};

export type AjustarSaldoEnderecoBody = {
  novaQuantidade: number;
  motivo: string;
};

export type TransferirSaldoEnderecoBody = {
  enderecoDestinoId: string;
  quantidade: number;
  observacao?: string;
};

export type BloquearSaldoEnderecoBody = {
  motivoBloqueioId: string;
  quantidade?: number;
  observacao?: string;
};

export type DesbloquearSaldoEnderecoBody = {
  observacao?: string;
};
