import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateTransportadoraInput,
  UpdateTransportadoraInput,
} from '../../../domain/model/transportadora/transportadora.model.js';
import {
  TRANSPORTADORA_REPOSITORY,
  type ITransportadoraRepository,
  type ListTransportadorasFilter,
} from '../../../domain/repositories/transportadora/transportadora.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { createTransportadoraDb } from './create-transportadora.drizzle.js';
import { deleteTransportadoraDb } from './delete-transportadora.drizzle.js';
import {
  findTransportadoraByIdDb,
  findTransportadoraByUnidadeAndRavexIdDb,
} from './find-transportadora.drizzle.js';
import { listTransportadorasDb } from './list-transportadoras.drizzle.js';
import { updateTransportadoraDb } from './update-transportadora.drizzle.js';

@Injectable()
export class TransportadoraService implements ITransportadoraRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  list(filter: ListTransportadorasFilter) {
    return listTransportadorasDb(this.db, filter);
  }

  findById(id: string) {
    return findTransportadoraByIdDb(this.db, id);
  }

  findByUnidadeAndRavexId(unidadeId: string, idRavexTransportadora: number) {
    return findTransportadoraByUnidadeAndRavexIdDb(
      this.db,
      unidadeId,
      idRavexTransportadora,
    );
  }

  create(data: CreateTransportadoraInput) {
    return createTransportadoraDb(this.db, data);
  }

  update(id: string, data: UpdateTransportadoraInput) {
    return updateTransportadoraDb(this.db, id, data);
  }

  delete(id: string) {
    return deleteTransportadoraDb(this.db, id);
  }
}
