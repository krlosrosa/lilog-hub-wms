import { Inject, Injectable } from '@nestjs/common';

import type { SubtipoConfiguracao } from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
  type IConfiguracaoOperacionalRepository,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import { mapConfiguracaoOperacionalToResponse } from '../../dtos/configuracao-operacional/map-configuracao-operacional-response.js';

type ListarConfiguracoesOperacionaisInput = {
  unidadeId: string;
  dominio?: string;
  categoria?: string;
  subtipo?: SubtipoConfiguracao;
  ativo?: boolean;
};

@Injectable()
export class ListarConfiguracoesOperacionaisUseCase {
  constructor(
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
  ) {}

  async execute(input: ListarConfiguracoesOperacionaisInput) {
    const items = await this.configuracaoOperacionalRepository.list({
      unidadeId: input.unidadeId,
      dominio: input.dominio,
      categoria: input.categoria,
      subtipo: input.subtipo,
      ativo: input.ativo,
    });

    return {
      items: items.map(mapConfiguracaoOperacionalToResponse),
    };
  }
}
