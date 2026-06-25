import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
  type IConfiguracaoOperacionalRepository,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';

@Injectable()
export class DeletarConfiguracaoOperacionalUseCase {
  constructor(
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
  ) {}

  async execute(id: string) {
    const atual = await this.configuracaoOperacionalRepository.findById(id);

    if (!atual) {
      throw new NotFoundException(`Configuração "${id}" não encontrada`);
    }

    await this.configuracaoOperacionalRepository.delete(id);
  }
}
