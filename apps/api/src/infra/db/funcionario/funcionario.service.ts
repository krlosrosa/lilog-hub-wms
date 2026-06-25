import { Inject, Injectable } from '@nestjs/common';

import type { CreateFuncionarioInput } from '../../../domain/model/funcionario/funcionario.model.js';
import type { UpdateFuncionarioInput } from '../../../domain/model/funcionario/funcionario.model.js';
import type {
  IFuncionarioRepository,
  ListFuncionariosFilter,
} from '../../../domain/repositories/funcionario/funcionario.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { createFuncionarioDb } from './create-funcionario.drizzle.js';
import {
  findFuncionarioByIdDb,
  findFuncionarioByMatriculaDb,
} from './find-funcionario.drizzle.js';
import { listFuncionariosDb } from './list-funcionarios.drizzle.js';
import { updateFuncionarioDb } from './update-funcionario.drizzle.js';

@Injectable()
export class FuncionarioService implements IFuncionarioRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  findById(id: number) {
    return findFuncionarioByIdDb(this.db, id);
  }

  findByMatricula(unidadeId: string, matricula: string) {
    return findFuncionarioByMatriculaDb(this.db, unidadeId, matricula);
  }

  create(data: CreateFuncionarioInput) {
    return createFuncionarioDb(this.db, data);
  }

  update(id: number, data: UpdateFuncionarioInput) {
    return updateFuncionarioDb(this.db, id, data);
  }

  list(filter: ListFuncionariosFilter) {
    return listFuncionariosDb(this.db, filter);
  }
}
