import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class ListSessaoFuncionariosUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(sessaoId: string) {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(sessaoId);

    if (!sessao) {
      throw new NotFoundException('Sessão não encontrada');
    }

    const items =
      await this.sessaoOperacaoRepository.listSessaoFuncionarios(sessaoId);

    return { items };
  }
}
