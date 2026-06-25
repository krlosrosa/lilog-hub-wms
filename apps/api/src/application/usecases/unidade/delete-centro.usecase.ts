import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';

@Injectable()
export class DeleteCentroUseCase {
  constructor(
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
  ) {}

  async execute(unidadeId: string, centroId: string) {
    const unidade = await this.unidadeRepository.findById(unidadeId);

    if (!unidade) {
      throw new NotFoundException(`Unidade "${unidadeId}" não encontrada`);
    }

    const centro = unidade.centros.find((item) => item.id === centroId);

    if (!centro) {
      throw new NotFoundException(
        `Centro "${centroId}" não encontrado para a unidade "${unidadeId}"`,
      );
    }

    await this.unidadeRepository.deleteCentro(centroId, unidadeId);
  }
}
