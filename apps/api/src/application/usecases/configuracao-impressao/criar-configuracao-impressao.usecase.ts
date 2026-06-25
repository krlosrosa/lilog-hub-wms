import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import {
  CreateConfiguracaoImpressaoInputSchema,
  validarConfiguracaoImpressao,
} from '../../../domain/model/configuracao-impressao/configuracao-impressao.model.js';
import {
  CONFIGURACAO_IMPRESSAO_REPOSITORY,
  type IConfiguracaoImpressaoRepository,
} from '../../../domain/repositories/configuracao-impressao/configuracao-impressao.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import { mapConfiguracaoImpressaoToResponse } from '../../dtos/configuracao-impressao/map-configuracao-impressao-response.js';

@Injectable()
export class CriarConfiguracaoImpressaoUseCase {
  constructor(
    @Inject(CONFIGURACAO_IMPRESSAO_REPOSITORY)
    private readonly configuracaoImpressaoRepository: IConfiguracaoImpressaoRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
  ) {}

  async execute(data: unknown) {
    const parsed = CreateConfiguracaoImpressaoInputSchema.parse(data);

    const unidade = await this.unidadeRepository.findById(parsed.unidadeId);

    if (!unidade) {
      throw new NotFoundException(
        `Unidade "${parsed.unidadeId}" não encontrada`,
      );
    }

    const erroValidacao = validarConfiguracaoImpressao(
      parsed.configuracao,
      parsed.templatesHtml,
    );

    if (erroValidacao) {
      throw new UnprocessableEntityException(erroValidacao);
    }

    const existente =
      await this.configuracaoImpressaoRepository.findByUnidadeAndNome(
        parsed.unidadeId,
        parsed.nome,
      );

    if (existente) {
      throw new ConflictException(
        `Já existe uma configuração com o nome "${parsed.nome}" nesta unidade`,
      );
    }

    const created = await this.configuracaoImpressaoRepository.create(parsed);

    return mapConfiguracaoImpressaoToResponse(created);
  }
}
