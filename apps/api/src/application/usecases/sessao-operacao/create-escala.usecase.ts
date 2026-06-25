import { Inject, Injectable } from '@nestjs/common';

import type { CreateEscalaInput } from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class CreateEscalaUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  execute(input: CreateEscalaInput) {
    return this.sessaoOperacaoRepository.createEscalaComEquipe(input);
  }
}
