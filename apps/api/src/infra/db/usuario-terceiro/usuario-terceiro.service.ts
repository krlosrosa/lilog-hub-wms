import { Inject, Injectable } from '@nestjs/common';

import type { CreateUsuarioTerceiroInput } from '../../../domain/model/usuario-terceiro/usuario-terceiro.model.js';
import type { UpdateUsuarioTerceiroInput } from '../../../domain/model/usuario-terceiro/usuario-terceiro.model.js';
import type {
  IUsuarioTerceiroRepository,
  ListUsuariosTerceirosFilter,
} from '../../../domain/repositories/usuario-terceiro/usuario-terceiro.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { createUsuarioTerceiroDb } from './create-usuario-terceiro.drizzle.js';
import {
  findUsuarioTerceiroByEmailDb,
  findUsuarioTerceiroByIdDb,
} from './find-usuario-terceiro.drizzle.js';
import { listUsuariosTerceirosDb } from './list-usuarios-terceiros.drizzle.js';
import {
  blockUsuarioTerceiroDb,
  updateUsuarioTerceiroDb,
} from './update-usuario-terceiro.drizzle.js';

@Injectable()
export class UsuarioTerceiroService implements IUsuarioTerceiroRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  findByEmail(email: string) {
    return findUsuarioTerceiroByEmailDb(this.db, email);
  }

  findById(id: number) {
    return findUsuarioTerceiroByIdDb(this.db, id);
  }

  create(data: CreateUsuarioTerceiroInput) {
    return createUsuarioTerceiroDb(this.db, data);
  }

  update(id: number, data: UpdateUsuarioTerceiroInput) {
    return updateUsuarioTerceiroDb(this.db, id, data);
  }

  list(filter: ListUsuariosTerceirosFilter) {
    return listUsuariosTerceirosDb(this.db, filter);
  }

  block(id: number) {
    return blockUsuarioTerceiroDb(this.db, id);
  }
}
