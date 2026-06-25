import { Inject, Injectable } from '@nestjs/common';

import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class GetFuncionarioEquipeUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(funcionarioId: number) {
    const equipeId =
      await this.sessaoOperacaoRepository.findEquipeIdByFuncionarioId(
        funcionarioId,
      );

    return { equipeId };
  }
}
