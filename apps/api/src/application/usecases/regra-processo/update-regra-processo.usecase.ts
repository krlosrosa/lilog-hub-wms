import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  UpdateRegraProcessoInputSchema,
  type UpdateRegraProcessoInput,
} from '../../../domain/model/regra-processo/regra-processo.model.js';
import { regraProcessoToEngineRule } from '../../services/regra-processo/rule-engine-converter.js';
import {
  REGRA_PROCESSO_REPOSITORY,
  type IRegraProcessoRepository,
} from '../../../domain/repositories/regra-processo/regra-processo.repository.js';

export type UpdateRegraProcessoUseCaseInput = {
  id: string;
  data: UpdateRegraProcessoInput;
};

@Injectable()
export class UpdateRegraProcessoUseCase {
  constructor(
    @Inject(REGRA_PROCESSO_REPOSITORY)
    private readonly regraProcessoRepository: IRegraProcessoRepository,
  ) {}

  async execute({ id, data }: UpdateRegraProcessoUseCaseInput) {
    const parsed = UpdateRegraProcessoInputSchema.parse(data);
    const current = await this.regraProcessoRepository.findById(id);

    if (!current) {
      throw new NotFoundException(`Regra "${id}" não encontrada`);
    }

    if (parsed.arvoreCondicoes && parsed.acoes) {
      regraProcessoToEngineRule({
        nome: parsed.nome ?? current.nome,
        prioridade: parsed.prioridade ?? current.prioridade,
        arvoreCondicoes: parsed.arvoreCondicoes,
        acoes: parsed.acoes,
      });
    }

    if (parsed.nome && parsed.nome !== current.nome) {
      const gatilho = parsed.gatilho ?? current.gatilho;
      const existing = await this.regraProcessoRepository.findByNome(
        current.unidadeId,
        gatilho,
        parsed.nome,
      );

      if (existing && existing.id !== id) {
        throw new BadRequestException(
          'Já existe uma regra com este nome para o gatilho informado',
        );
      }
    }

    try {
      const updated = await this.regraProcessoRepository.update(id, parsed);

      if (!updated) {
        throw new NotFoundException(`Regra "${id}" não encontrada`);
      }

      return updated;
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
