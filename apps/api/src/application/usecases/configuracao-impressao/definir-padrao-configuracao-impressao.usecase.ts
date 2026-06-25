import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  CONFIGURACAO_IMPRESSAO_REPOSITORY,
  type IConfiguracaoImpressaoRepository,
} from '../../../domain/repositories/configuracao-impressao/configuracao-impressao.repository.js';
import { mapConfiguracaoImpressaoToResponse } from '../../dtos/configuracao-impressao/map-configuracao-impressao-response.js';

@Injectable()
export class DefinirPadraoConfiguracaoImpressaoUseCase {
  constructor(
    @Inject(CONFIGURACAO_IMPRESSAO_REPOSITORY)
    private readonly configuracaoImpressaoRepository: IConfiguracaoImpressaoRepository,
  ) {}

  async execute(id: string) {
    const atual = await this.configuracaoImpressaoRepository.findById(id);

    if (!atual) {
      throw new NotFoundException(`Configuração "${id}" não encontrada`);
    }

    const updated = await this.configuracaoImpressaoRepository.definirPadrao(
      id,
      atual.unidadeId,
    );

    if (!updated) {
      throw new NotFoundException(`Configuração "${id}" não encontrada`);
    }

    return mapConfiguracaoImpressaoToResponse(updated);
  }
}
