import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import {
  CreateConfiguracaoOperacionalInputSchema,
  parseParametrosConfig,
  validarParametrosConfig,
} from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
  type IConfiguracaoOperacionalRepository,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import { mapConfiguracaoOperacionalToResponse } from '../../dtos/configuracao-operacional/map-configuracao-operacional-response.js';

@Injectable()
export class CriarConfiguracaoOperacionalUseCase {
  constructor(
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
  ) {}

  async execute(data: unknown) {
    const parsed = CreateConfiguracaoOperacionalInputSchema.parse(data);

    const unidade = await this.unidadeRepository.findById(parsed.unidadeId);

    if (!unidade) {
      throw new NotFoundException(
        `Unidade "${parsed.unidadeId}" não encontrada`,
      );
    }

    const erroValidacao = validarParametrosConfig(
      parsed.categoria,
      parsed.subtipo,
      parsed.parametros,
    );

    if (erroValidacao) {
      throw new UnprocessableEntityException(erroValidacao);
    }

    const existente =
      await this.configuracaoOperacionalRepository.findByUnidadeDominioCategoriaSubtipoNome(
        parsed.unidadeId,
        parsed.dominio,
        parsed.categoria,
        parsed.subtipo,
        parsed.nome,
      );

    if (existente) {
      throw new ConflictException(
        `Já existe uma configuração com o nome "${parsed.nome}" neste escopo`,
      );
    }

    const created = await this.configuracaoOperacionalRepository.create({
      ...parsed,
      parametros: parseParametrosConfig(
        parsed.categoria,
        parsed.subtipo,
        parsed.parametros,
      ),
    });

    return mapConfiguracaoOperacionalToResponse(created);
  }
}
