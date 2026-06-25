import { Inject, Injectable } from '@nestjs/common';

import type { CreateOperacaoDocaInput } from '../../../domain/model/doca/doca.model.js';
import {
  type IOperacaoDocaRepository,
  type ListOperacoesDocaFilter,
  type UpdateOperacaoDocaData,
} from '../../../domain/repositories/operacao-doca/operacao-doca.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { createOperacaoDocaDb } from './create-operacao-doca.drizzle.js';
import {
  findActiveOperacaoByDocaIdDb,
  findOperacaoDocaByIdDb,
} from './find-operacao-doca.drizzle.js';
import { listOperacoesDocaDb } from './list-operacoes-doca.drizzle.js';
import { updateOperacaoDocaDb } from './update-operacao-doca.drizzle.js';

@Injectable()
export class OperacaoDocaService implements IOperacaoDocaRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  list(filter: ListOperacoesDocaFilter) {
    return listOperacoesDocaDb(this.db, filter);
  }

  findById(id: string) {
    return findOperacaoDocaByIdDb(this.db, id);
  }

  findActiveByDocaId(docaId: string) {
    return findActiveOperacaoByDocaIdDb(this.db, docaId);
  }

  create(data: CreateOperacaoDocaInput) {
    return createOperacaoDocaDb(this.db, data);
  }

  update(id: string, data: UpdateOperacaoDocaData) {
    return updateOperacaoDocaDb(this.db, id, data);
  }
}
