import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  UpdateRegraEnderecamentoInputSchema,
  type UpdateRegraEnderecamentoInput,
} from '../../../domain/model/armazenagem/regra-enderecamento.model.js';
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';
import {
  REGRA_ENDERECAMENTO_REPOSITORY,
  type IRegraEnderecamentoRepository,
} from '../../../domain/repositories/armazenagem/regra-enderecamento.repository.js';

export type UpdateRegraEnderecamentoUseCaseInput = {
  id: string;
  data: UpdateRegraEnderecamentoInput;
};

@Injectable()
export class UpdateRegraEnderecamentoUseCase {
  constructor(
    @Inject(REGRA_ENDERECAMENTO_REPOSITORY)
    private readonly regraEnderecamentoRepository: IRegraEnderecamentoRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
  ) {}

  async execute({ id, data }: UpdateRegraEnderecamentoUseCaseInput) {
    const parsed = UpdateRegraEnderecamentoInputSchema.parse(data);
    const existing = await this.regraEnderecamentoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Regra "${id}" não encontrada`);
    }

    if (parsed.destinos) {
      await this.assertDestinosValidos(existing.unidadeId, parsed.destinos);
    }

    try {
      const updated = await this.regraEnderecamentoRepository.update(id, parsed);

      if (!updated) {
        throw new NotFoundException(`Regra "${id}" não encontrada`);
      }

      return updated;
    } catch (error) {
      this.mapConstraintError(error);
    }
  }

  private async assertDestinosValidos(
    unidadeId: string,
    destinos: NonNullable<UpdateRegraEnderecamentoInput['destinos']>,
  ) {
    const prioridades = destinos.map((destino) => destino.prioridade);
    const uniquePrioridades = new Set(prioridades);

    if (uniquePrioridades.size !== prioridades.length) {
      throw new BadRequestException(
        'Prioridades dos destinos devem ser únicas dentro da regra',
      );
    }

    for (const destino of destinos) {
      if (destino.tipo !== 'endereco' || !destino.enderecoId) {
        continue;
      }

      const endereco = await this.enderecoRepository.findById(destino.enderecoId);

      if (!endereco) {
        throw new NotFoundException(
          `Endereço "${destino.enderecoId}" não encontrado`,
        );
      }

      if (endereco.unidadeId !== unidadeId) {
        throw new BadRequestException(
          'Endereço informado não pertence à unidade da regra',
        );
      }
    }
  }

  private mapConstraintError(error: unknown): never {
    if (
      error instanceof Error &&
      error.message.includes('regras_enderecamento_unidade_criterio_unique')
    ) {
      throw new BadRequestException(
        'Já existe uma regra para este critério nesta unidade',
      );
    }

    throw error;
  }
}
