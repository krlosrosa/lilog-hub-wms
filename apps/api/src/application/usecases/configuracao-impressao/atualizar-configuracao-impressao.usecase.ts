import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import {
  UpdateConfiguracaoImpressaoInputSchema,
  validarConfiguracaoImpressao,
} from '../../../domain/model/configuracao-impressao/configuracao-impressao.model.js';
import {
  CONFIGURACAO_IMPRESSAO_REPOSITORY,
  type IConfiguracaoImpressaoRepository,
} from '../../../domain/repositories/configuracao-impressao/configuracao-impressao.repository.js';
import { mapConfiguracaoImpressaoToResponse } from '../../dtos/configuracao-impressao/map-configuracao-impressao-response.js';

type AtualizarConfiguracaoImpressaoInput = {
  id: string;
  data: unknown;
};

@Injectable()
export class AtualizarConfiguracaoImpressaoUseCase {
  constructor(
    @Inject(CONFIGURACAO_IMPRESSAO_REPOSITORY)
    private readonly configuracaoImpressaoRepository: IConfiguracaoImpressaoRepository,
  ) {}

  async execute({ id, data }: AtualizarConfiguracaoImpressaoInput) {
    const atual = await this.configuracaoImpressaoRepository.findById(id);

    if (!atual) {
      throw new NotFoundException(`Configuração "${id}" não encontrada`);
    }

    const parsed = UpdateConfiguracaoImpressaoInputSchema.parse(data);

    if (parsed.nome && parsed.nome !== atual.nome) {
      const existente =
        await this.configuracaoImpressaoRepository.findByUnidadeAndNome(
          atual.unidadeId,
          parsed.nome,
        );

      if (existente && existente.id !== id) {
        throw new ConflictException(
          `Já existe uma configuração com o nome "${parsed.nome}" nesta unidade`,
        );
      }
    }

    const configuracao = parsed.configuracao ?? atual.configuracao;
    const templatesHtml = parsed.templatesHtml ?? atual.templatesHtml;

    const erroValidacao = validarConfiguracaoImpressao(
      configuracao,
      templatesHtml,
    );

    if (erroValidacao) {
      throw new UnprocessableEntityException(erroValidacao);
    }

    const updated = await this.configuracaoImpressaoRepository.update(
      id,
      parsed,
    );

    if (!updated) {
      throw new NotFoundException(`Configuração "${id}" não encontrada`);
    }

    return mapConfiguracaoImpressaoToResponse(updated);
  }
}
