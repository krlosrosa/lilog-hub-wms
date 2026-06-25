import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { CreateCentroInput } from '../../../domain/model/unidade/unidade.model.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';

@Injectable()
export class AddCentroUseCase {
  constructor(
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
  ) {}

  async execute(unidadeId: string, data: CreateCentroInput) {
    const unidade = await this.unidadeRepository.findById(unidadeId);

    if (!unidade) {
      throw new NotFoundException(`Unidade "${unidadeId}" não encontrada`);
    }

    return this.unidadeRepository.addCentro({
      ...data,
      unidadeId,
    });
  }
}
