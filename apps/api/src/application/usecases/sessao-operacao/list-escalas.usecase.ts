import { Inject, Injectable } from '@nestjs/common';

import type { ListEscalasFilter } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class ListEscalasUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  execute(filter: ListEscalasFilter) {
    return this.sessaoOperacaoRepository.listEscalas(filter);
  }
}
