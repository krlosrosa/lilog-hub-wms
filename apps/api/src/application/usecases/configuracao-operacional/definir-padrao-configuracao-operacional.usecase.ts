import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
  type IConfiguracaoOperacionalRepository,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import { mapConfiguracaoOperacionalToResponse } from '../../dtos/configuracao-operacional/map-configuracao-operacional-response.js';

@Injectable()
export class DefinirPadraoConfiguracaoOperacionalUseCase {
  constructor(
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
  ) {}

  async execute(id: string) {
    const atual = await this.configuracaoOperacionalRepository.findById(id);

    if (!atual) {
      throw new NotFoundException(`Configuração "${id}" não encontrada`);
    }

    const updated = await this.configuracaoOperacionalRepository.definirPadrao(
      id,
      atual.unidadeId,
      atual.dominio,
      atual.categoria,
      atual.subtipo,
    );

    if (!updated) {
      throw new NotFoundException(`Configuração "${id}" não encontrada`);
    }

    return mapConfiguracaoOperacionalToResponse(updated);
  }
}
