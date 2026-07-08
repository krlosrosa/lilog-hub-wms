import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateMotivoBloqueioSaldoInput,
  UpdateMotivoBloqueioSaldoInput,
} from '../../../domain/model/estoque/motivo-bloqueio-saldo.model.js';
import type {
  IMotivoBloqueioSaldoRepository,
  ListMotivosBloqueioSaldoFilter,
} from '../../../domain/repositories/estoque/motivo-bloqueio-saldo.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import {
  createMotivoBloqueioSaldoDb,
  deleteMotivoBloqueioSaldoDb,
  ensureMotivosBloqueioSistemaUnidadeDb,
  findMotivoBloqueioSaldoByCodigoDb,
  findMotivoBloqueioSaldoByIdDb,
  listMotivosBloqueioSaldoDb,
  updateMotivoBloqueioSaldoDb,
} from './motivo-bloqueio-saldo.drizzle.js';

@Injectable()
export class MotivoBloqueioSaldoService implements IMotivoBloqueioSaldoRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleClient,
  ) {}

  create(input: CreateMotivoBloqueioSaldoInput) {
    return createMotivoBloqueioSaldoDb(this.db, input);
  }

  list(filter: ListMotivosBloqueioSaldoFilter) {
    return listMotivosBloqueioSaldoDb(this.db, filter);
  }

  findById(id: string) {
    return findMotivoBloqueioSaldoByIdDb(this.db, id);
  }

  findByCodigo(unidadeId: string, codigo: string) {
    return findMotivoBloqueioSaldoByCodigoDb(this.db, unidadeId, codigo);
  }

  update(id: string, input: UpdateMotivoBloqueioSaldoInput) {
    return updateMotivoBloqueioSaldoDb(this.db, id, input);
  }

  delete(id: string) {
    return deleteMotivoBloqueioSaldoDb(this.db, id);
  }

  ensureMotivosSistemaUnidade(unidadeId: string) {
    return ensureMotivosBloqueioSistemaUnidadeDb(this.db, unidadeId);
  }
}
