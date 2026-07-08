import { Inject, Injectable } from '@nestjs/common';

import type { ListUsuariosTerceirosFilter } from '../../../domain/repositories/usuario-terceiro/usuario-terceiro.repository.js';
import {
  USUARIO_TERCEIRO_REPOSITORY,
  type IUsuarioTerceiroRepository,
} from '../../../domain/repositories/usuario-terceiro/usuario-terceiro.repository.js';

@Injectable()
export class ListUsuariosTerceirosUseCase {
  constructor(
    @Inject(USUARIO_TERCEIRO_REPOSITORY)
    private readonly usuarioTerceiroRepository: IUsuarioTerceiroRepository,
  ) {}

  execute(filter: ListUsuariosTerceirosFilter) {
    return this.usuarioTerceiroRepository.list(filter);
  }
}
