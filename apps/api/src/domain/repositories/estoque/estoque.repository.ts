import type { Deposito, DepositoCodigo } from '../../model/estoque/deposito.model.js';
import type {
  AjustarSaldoInput,
  EstornarPorDocumentoInput,
  MovimentacaoEstoque,
  RegistrarEntradaInput,
  TransferirDepositoInput,
} from '../../model/estoque/movimentacao-estoque.model.js';
import type { Saldo } from '../../model/estoque/saldo.model.js';

export const ESTOQUE_REPOSITORY = 'IEstoqueRepository';

export type ListSaldosFilter = {
  unidadeId: string;
  depositoCodigo?: DepositoCodigo;
  produtoId?: string;
};

export type NetSaldoTransfPorProduto = {
  produtoId: string;
  quantidade: number;
  unidadeMedida: string;
  lote: string;
  validade: Date | null;
  numeroSerie: string;
};

export interface IEstoqueRepository {
  ensureDepositosUnidade(unidadeId: string): Promise<Deposito[]>;
  findDepositoByCodigo(
    unidadeId: string,
    codigo: DepositoCodigo,
  ): Promise<Deposito | null>;
  listDepositos(unidadeId: string): Promise<Deposito[]>;
  listSaldos(filter: ListSaldosFilter): Promise<Saldo[]>;
  listSaldosByDepositoId(depositoId: string): Promise<Saldo[]>;
  getNetSaldoTransfPorDocumento(
    unidadeId: string,
    depositoTransfId: string,
    documentoRef: string,
  ): Promise<NetSaldoTransfPorProduto[]>;
  registrarEntrada(input: RegistrarEntradaInput): Promise<MovimentacaoEstoque>;
  transferirDeposito(
    input: TransferirDepositoInput,
  ): Promise<MovimentacaoEstoque>;
  ajustarSaldo(input: AjustarSaldoInput): Promise<MovimentacaoEstoque>;
  estornarPorDocumento(
    input: EstornarPorDocumentoInput,
  ): Promise<MovimentacaoEstoque[]>;
}
