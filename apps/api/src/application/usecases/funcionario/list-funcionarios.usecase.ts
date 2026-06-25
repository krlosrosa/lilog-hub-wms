import { Inject, Injectable } from '@nestjs/common';

import type { ListFuncionariosFilter } from '../../../domain/repositories/funcionario/funcionario.repository.js';
import {
  FUNCIONARIO_REPOSITORY,
  type IFuncionarioRepository,
} from '../../../domain/repositories/funcionario/funcionario.repository.js';

@Injectable()
export class ListFuncionariosUseCase {
  constructor(
    @Inject(FUNCIONARIO_REPOSITORY)
    private readonly funcionarioRepository: IFuncionarioRepository,
  ) {}

  execute(filter: ListFuncionariosFilter) {
    return this.funcionarioRepository.list(filter);
  }
}
