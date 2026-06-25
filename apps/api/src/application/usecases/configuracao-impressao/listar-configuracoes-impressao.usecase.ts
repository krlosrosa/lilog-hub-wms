import { Inject, Injectable } from '@nestjs/common';

import {
  CONFIGURACAO_IMPRESSAO_REPOSITORY,
  type IConfiguracaoImpressaoRepository,
} from '../../../domain/repositories/configuracao-impressao/configuracao-impressao.repository.js';
import { mapConfiguracaoImpressaoToResponse } from '../../dtos/configuracao-impressao/map-configuracao-impressao-response.js';

type ListarConfiguracoesImpressaoInput = {
  unidadeId: string;
};

@Injectable()
export class ListarConfiguracoesImpressaoUseCase {
  constructor(
    @Inject(CONFIGURACAO_IMPRESSAO_REPOSITORY)
    private readonly configuracaoImpressaoRepository: IConfiguracaoImpressaoRepository,
  ) {}

  async execute(input: ListarConfiguracoesImpressaoInput) {
    const items = await this.configuracaoImpressaoRepository.list({
      unidadeId: input.unidadeId,
    });

    return {
      items: items.map(mapConfiguracaoImpressaoToResponse),
    };
  }
}
