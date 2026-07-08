import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CreateRegraEnderecamentoInputSchema,
  type CreateRegraEnderecamentoInput,
} from '../../../domain/model/armazenagem/regra-enderecamento.model.js';
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';
import {
  REGRA_ENDERECAMENTO_REPOSITORY,
  type IRegraEnderecamentoRepository,
} from '../../../domain/repositories/armazenagem/regra-enderecamento.repository.js';

export type CreateRegraEnderecamentoUseCaseInput = {
  data: CreateRegraEnderecamentoInput;
};

@Injectable()
export class CreateRegraEnderecamentoUseCase {
  constructor(
    @Inject(REGRA_ENDERECAMENTO_REPOSITORY)
    private readonly regraEnderecamentoRepository: IRegraEnderecamentoRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
  ) {}

  async execute({ data }: CreateRegraEnderecamentoUseCaseInput) {
    const parsed = CreateRegraEnderecamentoInputSchema.parse(data);

    await this.assertDestinosValidos(parsed.unidadeId, parsed.destinos);

    try {
      return await this.regraEnderecamentoRepository.create(parsed);
    } catch (error) {
      this.mapConstraintError(error);
    }
  }

  private async assertDestinosValidos(
    unidadeId: string,
    destinos: CreateRegraEnderecamentoInput['destinos'],
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
