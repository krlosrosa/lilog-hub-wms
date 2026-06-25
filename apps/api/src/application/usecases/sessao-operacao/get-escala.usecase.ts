import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class GetEscalaUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(id: string) {
    const escala = await this.sessaoOperacaoRepository.findEscalaById(id);

    if (!escala) {
      throw new NotFoundException('Escala não encontrada');
    }

    return escala;
  }
}
