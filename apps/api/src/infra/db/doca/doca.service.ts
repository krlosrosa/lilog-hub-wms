import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateDocaInput,
  UpdateDocaInput,
} from '../../../domain/model/doca/doca.model.js';
import {
  type IDocaRepository,
  type ListDocasFilter,
} from '../../../domain/repositories/doca/doca.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { createDocaDb } from './create-doca.drizzle.js';
import { bulkCreateDocasDb } from './bulk-create-docas.drizzle.js';
import { deleteDocaDb } from './delete-doca.drizzle.js';
import {
  findDocaByIdDb,
  findDocaByUnidadeAndCodigoDb,
  hasDocaOperationalHistoryDb,
} from './find-doca.drizzle.js';
import { listDocasDb } from './list-docas.drizzle.js';
import { updateDocaDb } from './update-doca.drizzle.js';

@Injectable()
export class DocaService implements IDocaRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  list(filter: ListDocasFilter) {
    return listDocasDb(this.db, filter);
  }

  findById(id: string) {
    return findDocaByIdDb(this.db, id);
  }

  findByUnidadeAndCodigo(unidadeId: string, codigo: string) {
    return findDocaByUnidadeAndCodigoDb(this.db, unidadeId, codigo);
  }

  hasOperationalHistory(id: string) {
    return hasDocaOperationalHistoryDb(this.db, id);
  }

  create(data: CreateDocaInput) {
    return createDocaDb(this.db, data);
  }

  createBulk(items: CreateDocaInput[]) {
    return bulkCreateDocasDb(this.db, items);
  }

  update(id: string, data: UpdateDocaInput) {
    return updateDocaDb(this.db, id, data);
  }

  delete(id: string) {
    return deleteDocaDb(this.db, id);
  }
}
