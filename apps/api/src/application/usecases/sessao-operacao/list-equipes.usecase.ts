import { Inject, Injectable } from '@nestjs/common';

import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
  type ListEquipesFilter,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class ListEquipesUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  execute(filter: ListEquipesFilter) {
    return this.sessaoOperacaoRepository.listEquipes(filter);
  }
}
