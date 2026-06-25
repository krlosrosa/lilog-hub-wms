import { Inject, Injectable } from '@nestjs/common';

import type {
  AjustarSaldoInput,
  EstornarPorDocumentoInput,
  RegistrarEntradaInput,
  TransferirDepositoInput,
} from '../../../domain/model/estoque/movimentacao-estoque.model.js';
import type { DepositoCodigo } from '../../../domain/model/estoque/deposito.model.js';
import type {
  IEstoqueRepository,
  ListSaldosFilter,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import {
  ensureDepositosUnidadeDb,
  findDepositoByCodigoDb,
  listDepositosDb,
} from './ensure-depositos-unidade.drizzle.js';
import { getNetSaldoTransfPorDocumentoDb } from './get-net-saldo-transf-por-documento.drizzle.js';
import { listSaldosByDepositoIdDb, listSaldosDb } from './list-saldos.drizzle.js';
import {
  ajustarSaldoDb,
  estornarPorDocumentoDb,
  registrarEntradaDb,
  transferirDepositoDb,
} from './movimentar-estoque.drizzle.js';

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

  listDepositos(unidadeId: string) {
    return listDepositosDb(this.db, unidadeId);
  }

  listSaldos(filter: ListSaldosFilter) {
    return listSaldosDb(this.db, filter);
  }

  listSaldosByDepositoId(depositoId: string) {
    return listSaldosByDepositoIdDb(this.db, depositoId);
  }

  getNetSaldoTransfPorDocumento(
    unidadeId: string,
    depositoTransfId: string,
    documentoRef: string,
  ) {
    return getNetSaldoTransfPorDocumentoDb(
      this.db,
      unidadeId,
      depositoTransfId,
      documentoRef,
    );
  }

  registrarEntrada(input: RegistrarEntradaInput) {
    return registrarEntradaDb(this.db, input);
  }

  transferirDeposito(input: TransferirDepositoInput) {
    return transferirDepositoDb(this.db, input);
  }

  ajustarSaldo(input: AjustarSaldoInput) {
    return ajustarSaldoDb(this.db, input);
  }

  estornarPorDocumento(input: EstornarPorDocumentoInput) {
    return estornarPorDocumentoDb(this.db, input);
  }
}
