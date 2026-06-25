import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateUnidadeInput,
  UpdateCentroInput,
  UpdateUnidadeInput,
} from '../../../domain/model/unidade/unidade.model.js';
import {
  UNIDADE_REPOSITORY,
  type AddCentroInput,
  type IUnidadeRepository,
  type ListUnidadesFilter,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { addCentroDb } from './add-centro.drizzle.js';
import { createUnidadeDb } from './create-unidade.drizzle.js';
import { deleteCentroDb } from './delete-centro.drizzle.js';
import { deleteUnidadeDb } from './delete-unidade.drizzle.js';
import { findUnidadeDb } from './find-unidade.drizzle.js';
import { listCentrosDb } from './list-centros.drizzle.js';
import { listUnidadesDb } from './list-unidades.drizzle.js';
import { updateCentroDb } from './update-centro.drizzle.js';
import { updateUnidadeDb } from './update-unidade.drizzle.js';

@Injectable()
export class UnidadeService implements IUnidadeRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  list(filter: ListUnidadesFilter) {
    return listUnidadesDb(this.db, filter);
  }

  listCentros(unidadeId?: string) {
    return listCentrosDb(this.db, unidadeId);
  }

  findById(id: string) {
    return findUnidadeDb(this.db, id);
  }

  create(data: CreateUnidadeInput) {
    return createUnidadeDb(this.db, data);
  }

  update(id: string, data: UpdateUnidadeInput) {
    return updateUnidadeDb(this.db, id, data);
  }

  delete(id: string) {
    return deleteUnidadeDb(this.db, id);
  }

  addCentro(data: AddCentroInput) {
    return addCentroDb(this.db, data);
  }

  updateCentro(
    centroId: string,
    unidadeId: string,
    data: UpdateCentroInput,
  ) {
    return updateCentroDb(this.db, centroId, unidadeId, data);
  }

  deleteCentro(centroId: string, unidadeId: string) {
    return deleteCentroDb(this.db, centroId, unidadeId);
  }
}
