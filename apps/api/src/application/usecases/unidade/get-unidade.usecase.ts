import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';

@Injectable()
export class GetUnidadeUseCase {
  constructor(
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
  ) {}

  async execute(id: string) {
    const unidade = await this.unidadeRepository.findById(id);

    if (!unidade) {
      throw new NotFoundException(`Unidade "${id}" não encontrada`);
    }

    return unidade;
  }
}
