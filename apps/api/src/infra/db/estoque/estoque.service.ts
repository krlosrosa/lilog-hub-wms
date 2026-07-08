import { Inject, Injectable } from '@nestjs/common';

import type { DepositoCodigo } from '../../../domain/model/estoque/deposito.model.js';
import type {
  ConsumirReservaInput,
  CriarReservaInput,
  LiberarReservaInput,
} from '../../../domain/model/estoque/reserva-estoque.model.js';
import type {
  BloquearSaldoEnderecoInput,
  DesbloquearSaldoEnderecoInput,
  EnsureEnderecoVirtualDepositoInput,
  IEstoqueRepository,
  ListReservasAtivasFilter,
  ListSaldosEnderecoFilter,
  ListDisponibilidadeEstoqueFilter,
  ListDisponibilidadeEstoqueAgrupadoFilter,
  ListHistoricoProdutoFilter,
  RegistrarMovimentacaoEstoqueInput,
  SaldoDisponivelFilter,
  UpdateDepositoInput,
  UpsertSaldoEnderecoInput,
  CreateDepositoInput,
  AjustarSaldoEnderecoInput,
  TransferirSaldoEnderecoInput,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import {
  createDepositoDb,
  findDepositoByCodigoUnidadeDb,
  findDepositoByIdDb,
  updateDepositoDb,
} from './crud-deposito.drizzle.js';
import { ensureDepositosUnidadeDb, findDepositoByCodigoDb, listDepositosDb } from './ensure-depositos-unidade.drizzle.js';
import {
  consumirReservaDb,
  criarReservaDb,
  getSaldoDisponivelDb,
  liberarReservaDb,
  listReservasAtivasDb,
} from './reserva-estoque.drizzle.js';
import { listSaldosEnderecoDb } from './saldo-endereco.drizzle.js';
import { listDisponibilidadeEstoqueDb } from './list-disponibilidade-estoque.drizzle.js';
import { listDisponibilidadeEstoqueAgrupadoDb } from './list-disponibilidade-estoque-agrupado.drizzle.js';
import { listGruposDisponibilidadeEstoqueDb } from './list-grupos-disponibilidade-estoque.drizzle.js';
import { listHistoricoProdutoDb } from './list-historico-produto.drizzle.js';
import { ensureEnderecoVirtualDepositoDb } from './ensure-endereco-virtual-deposito.drizzle.js';
import {
  existsMovimentacaoByDocumentoRefDb,
  registrarMovimentacaoEstoqueDb,
} from './registrar-movimentacao-estoque.drizzle.js';
import { upsertSaldoEnderecoDb } from './upsert-saldo-endereco.drizzle.js';
import {
  bloquearSaldoEnderecoDb,
  desbloquearSaldoEnderecoDb,
} from './bloquear-saldo-endereco.drizzle.js';
import { ajustarSaldoEnderecoDb } from './ajustar-saldo-endereco.drizzle.js';
import { getSaldoEnderecoByIdDb } from './get-saldo-endereco.drizzle.js';
import { transferirSaldoEnderecoDb } from './transferir-saldo-endereco.drizzle.js';

@Injectable()
export class EstoqueService implements IEstoqueRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleClient,
  ) {}

  ensureDepositosUnidade(unidadeId: string) {
    return ensureDepositosUnidadeDb(this.db, unidadeId);
  }

  findDepositoByCodigo(unidadeId: string, codigo: DepositoCodigo) {
    return findDepositoByCodigoDb(this.db, unidadeId, codigo);
  }

  findDepositoByUnidadeAndCodigo(unidadeId: string, codigo: string) {
    return findDepositoByCodigoUnidadeDb(this.db, unidadeId, codigo);
  }

  listDepositos(unidadeId: string) {
    return listDepositosDb(this.db, unidadeId);
  }

  findDepositoById(id: string) {
    return findDepositoByIdDb(this.db, id);
  }

  createDeposito(input: CreateDepositoInput) {
    return createDepositoDb(this.db, input);
  }

  updateDeposito(id: string, data: UpdateDepositoInput) {
    return updateDepositoDb(this.db, id, data);
  }

  listSaldosEndereco(filter: ListSaldosEnderecoFilter) {
    return listSaldosEnderecoDb(this.db, filter);
  }

  findSaldoEnderecoById(id: string) {
    return getSaldoEnderecoByIdDb(this.db, id);
  }

  ajustarSaldoEndereco(input: AjustarSaldoEnderecoInput) {
    return ajustarSaldoEnderecoDb(this.db, input);
  }

  transferirSaldoEndereco(input: TransferirSaldoEnderecoInput) {
    return transferirSaldoEnderecoDb(this.db, input);
  }

  listDisponibilidadeEstoque(filter: ListDisponibilidadeEstoqueFilter) {
    return listDisponibilidadeEstoqueDb(this.db, filter);
  }

  listDisponibilidadeEstoqueAgrupado(
    filter: ListDisponibilidadeEstoqueAgrupadoFilter,
  ) {
    return listDisponibilidadeEstoqueAgrupadoDb(this.db, filter);
  }

  listGruposDisponibilidadeEstoque(unidadeId: string) {
    return listGruposDisponibilidadeEstoqueDb(this.db, unidadeId);
  }

  criarReserva(input: CriarReservaInput) {
    return criarReservaDb(this.db, input);
  }

  liberarReserva(input: LiberarReservaInput) {
    return liberarReservaDb(this.db, input);
  }

  consumirReserva(input: ConsumirReservaInput) {
    return consumirReservaDb(this.db, input);
  }

  listReservasAtivas(filter: ListReservasAtivasFilter) {
    return listReservasAtivasDb(this.db, filter);
  }

  getSaldoDisponivel(filter: SaldoDisponivelFilter) {
    return getSaldoDisponivelDb(this.db, filter);
  }

  ensureEnderecoVirtualDeposito(input: EnsureEnderecoVirtualDepositoInput) {
    return ensureEnderecoVirtualDepositoDb(this.db, input);
  }

  upsertSaldoEndereco(input: UpsertSaldoEnderecoInput) {
    return upsertSaldoEnderecoDb(this.db, input);
  }

  bloquearSaldoEndereco(input: BloquearSaldoEnderecoInput) {
    return bloquearSaldoEnderecoDb(this.db, input);
  }

  desbloquearSaldoEndereco(input: DesbloquearSaldoEnderecoInput) {
    return desbloquearSaldoEnderecoDb(this.db, input);
  }

  existsMovimentacaoByDocumentoRef(documentoRef: string) {
    return existsMovimentacaoByDocumentoRefDb(this.db, documentoRef);
  }

  registrarMovimentacaoEstoque(input: RegistrarMovimentacaoEstoqueInput) {
    return registrarMovimentacaoEstoqueDb(this.db, input);
  }

  listHistoricoProduto(filter: ListHistoricoProdutoFilter) {
    return listHistoricoProdutoDb(this.db, filter);
  }
}
