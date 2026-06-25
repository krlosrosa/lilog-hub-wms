import { Inject, Injectable } from '@nestjs/common';

import type { CncOrigem } from '../../../domain/model/cnc/cnc.model.js';
import type {
  CreateCncInput,
  ICncRepository,
  ListCncsFilter,
  UpdateCncSituacaoInput,
} from '../../../domain/repositories/cnc/cnc.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { countCncByYearDb } from './find-cnc.drizzle.js';
import { createCncDb } from './create-cnc.drizzle.js';
import { findCncByIdDb, findCncByOrigemDb } from './find-cnc.drizzle.js';
import { listCncsDb } from './list-cncs.drizzle.js';
import { updateCncSituacaoDb } from './update-cnc-situacao.drizzle.js';

@Injectable()
export class CncService implements ICncRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  create(data: CreateCncInput) {
    return createCncDb(this.db, data);
  }

  findById(id: string) {
    return findCncByIdDb(this.db, id);
  }

  findByOrigem(origem: CncOrigem, origemId: string) {
    return findCncByOrigemDb(this.db, origem, origemId);
  }

  countByYear(year: number) {
    return countCncByYearDb(this.db, year);
  }

  list(filter: ListCncsFilter) {
    return listCncsDb(this.db, filter);
  }

  updateSituacao(id: string, data: UpdateCncSituacaoInput) {
    return updateCncSituacaoDb(this.db, id, data);
  }
}
