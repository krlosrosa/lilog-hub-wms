import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  CreateRegraProcessoInputSchema,
  type CreateRegraProcessoInput,
} from '../../../domain/model/regra-processo/regra-processo.model.js';
import { regraProcessoToEngineRule } from '../../services/regra-processo/rule-engine-converter.js';
import {
  REGRA_PROCESSO_REPOSITORY,
  type IRegraProcessoRepository,
} from '../../../domain/repositories/regra-processo/regra-processo.repository.js';

export type CreateRegraProcessoUseCaseInput = {
  data: CreateRegraProcessoInput;
};

@Injectable()
export class CreateRegraProcessoUseCase {
  constructor(
    @Inject(REGRA_PROCESSO_REPOSITORY)
    private readonly regraProcessoRepository: IRegraProcessoRepository,
  ) {}

  async execute({ data }: CreateRegraProcessoUseCaseInput) {
    const parsed = CreateRegraProcessoInputSchema.parse(data);

    regraProcessoToEngineRule({
      nome: parsed.nome,
      prioridade: parsed.prioridade,
      arvoreCondicoes: parsed.arvoreCondicoes,
      acoes: parsed.acoes,
    });

    const existing = await this.regraProcessoRepository.findByNome(
      parsed.unidadeId,
      parsed.gatilho,
      parsed.nome,
    );

    if (existing) {
      throw new BadRequestException(
        'Já existe uma regra com este nome para o gatilho informado',
      );
    }

    try {
      return await this.regraProcessoRepository.create(parsed);
    } catch (error) {
      this.mapConstraintError(error);
    }
  }

  private mapConstraintError(error: unknown): never {
    if (
      error instanceof Error &&
      error.message.includes('regras_processo_unidade_gatilho_nome_unique')
    ) {
      throw new BadRequestException(
        'Já existe uma regra com este nome para o gatilho informado',
      );
    }

    throw error;
  }
}
