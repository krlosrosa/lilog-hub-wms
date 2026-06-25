import { Inject, Injectable } from '@nestjs/common';

import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
  type ListUnidadesFilter,
} from '../../../domain/repositories/unidade/unidade.repository.js';

@Injectable()
export class ListUnidadesUseCase {
  constructor(
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
  ) {}

  execute(filter: ListUnidadesFilter) {
    return this.unidadeRepository.list(filter);
  }
}
