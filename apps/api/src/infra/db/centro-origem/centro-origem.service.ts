import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateCentroOrigemInput,
  UpdateCentroOrigemInput,
} from '../../../domain/model/centro-origem/centro-origem.model.js';
import {
  type ICentroOrigemRepository,
  type ListCentrosOrigemFilter,
} from '../../../domain/repositories/centro-origem/centro-origem.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { createCentroOrigemDb } from './create-centro-origem.drizzle.js';
import { deleteCentroOrigemDb } from './delete-centro-origem.drizzle.js';
import { findCentroOrigemByIdDb } from './find-centro-origem-by-id.drizzle.js';
import { listCentrosOrigemDb } from './list-centros-origem.drizzle.js';
import { updateCentroOrigemDb } from './update-centro-origem.drizzle.js';

@Injectable()
export class CentroOrigemService implements ICentroOrigemRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  list(filter: ListCentrosOrigemFilter) {
    return listCentrosOrigemDb(this.db, filter);
  }

  findById(centro: string) {
    return findCentroOrigemByIdDb(this.db, centro);
  }

  create(data: CreateCentroOrigemInput) {
    return createCentroOrigemDb(this.db, data);
  }

  update(centro: string, data: UpdateCentroOrigemInput) {
    return updateCentroOrigemDb(this.db, centro, data);
  }

  delete(centro: string) {
    return deleteCentroOrigemDb(this.db, centro);
  }
}
