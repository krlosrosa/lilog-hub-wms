import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
  type SalvarChecklistDevolucaoInput,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

export type SalvarChecklistDevolucaoUseCaseInput = SalvarChecklistDevolucaoInput;

@Injectable()
export class SalvarChecklistDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
  ) {}

  async execute(input: SalvarChecklistDevolucaoUseCaseInput) {
    const result = await this.devolucaoRepository.salvarChecklist(input);

    if (!result) {
      throw new NotFoundException(
        `Demanda de devolução "${input.demandaId}" não encontrada`,
      );
    }

    return result;
  }
}
