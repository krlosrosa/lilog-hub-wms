import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  CONFIGURACAO_IMPRESSAO_REPOSITORY,
  type IConfiguracaoImpressaoRepository,
} from '../../../domain/repositories/configuracao-impressao/configuracao-impressao.repository.js';

@Injectable()
export class DeletarConfiguracaoImpressaoUseCase {
  constructor(
    @Inject(CONFIGURACAO_IMPRESSAO_REPOSITORY)
    private readonly configuracaoImpressaoRepository: IConfiguracaoImpressaoRepository,
  ) {}

  async execute(id: string) {
    const atual = await this.configuracaoImpressaoRepository.findById(id);

    if (!atual) {
      throw new NotFoundException(`Configuração "${id}" não encontrada`);
    }

    await this.configuracaoImpressaoRepository.delete(id);
  }
}
