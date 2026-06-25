import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';

@Injectable()
export class DeleteUnidadeUseCase {
  constructor(
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.unidadeRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Unidade "${id}" não encontrada`);
    }

    await this.unidadeRepository.delete(id);
  }
}
