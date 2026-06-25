import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  OPERACAO_DOCA_REPOSITORY,
  type IOperacaoDocaRepository,
} from '../../../domain/repositories/operacao-doca/operacao-doca.repository.js';

@Injectable()
export class GetOperacaoDocaUseCase {
  constructor(
    @Inject(OPERACAO_DOCA_REPOSITORY)
    private readonly operacaoDocaRepository: IOperacaoDocaRepository,
  ) {}

  async execute(id: string) {
    const operacao = await this.operacaoDocaRepository.findById(id);

    if (!operacao) {
      throw new NotFoundException(`Operação "${id}" não encontrada`);
    }

    return operacao;
  }
}
