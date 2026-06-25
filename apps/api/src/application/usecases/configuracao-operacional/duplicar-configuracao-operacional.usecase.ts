import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
  type IConfiguracaoOperacionalRepository,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import { mapConfiguracaoOperacionalToResponse } from '../../dtos/configuracao-operacional/map-configuracao-operacional-response.js';

@Injectable()
export class DuplicarConfiguracaoOperacionalUseCase {
  constructor(
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
  ) {}

  async execute(id: string) {
    const atual = await this.configuracaoOperacionalRepository.findById(id);

    if (!atual) {
      throw new NotFoundException(`Configuração "${id}" não encontrada`);
    }

    const nomeCopia = `${atual.nome} (cópia)`;
    const existente =
      await this.configuracaoOperacionalRepository.findByUnidadeDominioCategoriaSubtipoNome(
        atual.unidadeId,
        atual.dominio,
        atual.categoria,
        atual.subtipo,
        nomeCopia,
      );

    if (existente) {
      throw new ConflictException(
        `Já existe uma configuração com o nome "${nomeCopia}" neste escopo`,
      );
    }

    const duplicada = await this.configuracaoOperacionalRepository.duplicar(id);

    if (!duplicada) {
      throw new NotFoundException(`Configuração "${id}" não encontrada`);
    }

    return mapConfiguracaoOperacionalToResponse(duplicada);
  }
}
