import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import {
  UpdateConfiguracaoOperacionalInputSchema,
  parseParametrosConfig,
  validarParametrosConfig,
} from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
  type IConfiguracaoOperacionalRepository,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import { mapConfiguracaoOperacionalToResponse } from '../../dtos/configuracao-operacional/map-configuracao-operacional-response.js';

type AtualizarConfiguracaoOperacionalInput = {
  id: string;
  data: unknown;
};

@Injectable()
export class AtualizarConfiguracaoOperacionalUseCase {
  constructor(
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
  ) {}

  async execute({ id, data }: AtualizarConfiguracaoOperacionalInput) {
    const atual = await this.configuracaoOperacionalRepository.findById(id);

    if (!atual) {
      throw new NotFoundException(`Configuração "${id}" não encontrada`);
    }

    const parsed = UpdateConfiguracaoOperacionalInputSchema.parse(data);

    if (parsed.nome && parsed.nome !== atual.nome) {
      const existente =
        await this.configuracaoOperacionalRepository.findByUnidadeDominioCategoriaSubtipoNome(
          atual.unidadeId,
          atual.dominio,
          atual.categoria,
          atual.subtipo,
          parsed.nome,
        );

      if (existente && existente.id !== id) {
        throw new ConflictException(
          `Já existe uma configuração com o nome "${parsed.nome}" neste escopo`,
        );
      }
    }

    const parametros = parsed.parametros ?? atual.parametros;

    const erroValidacao = validarParametrosConfig(
      atual.categoria,
      atual.subtipo,
      parametros,
    );

    if (erroValidacao) {
      throw new UnprocessableEntityException(erroValidacao);
    }

    const updated = await this.configuracaoOperacionalRepository.update(id, {
      ...parsed,
      ...(parsed.parametros !== undefined
        ? {
            parametros: parseParametrosConfig(
              atual.categoria,
              atual.subtipo,
              parsed.parametros,
            ),
          }
        : {}),
    });

    if (!updated) {
      throw new NotFoundException(`Configuração "${id}" não encontrada`);
    }

    return mapConfiguracaoOperacionalToResponse(updated);
  }
}
