import { Inject, Injectable } from '@nestjs/common';

import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';

@Injectable()
export class ListCentrosUseCase {
  constructor(
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
  ) {}

  execute(unidadeId?: string) {
    return this.unidadeRepository.listCentros(unidadeId);
  }
}
