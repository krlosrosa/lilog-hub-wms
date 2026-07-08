import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  CreateMotivoBloqueioSaldoInputSchema,
  type CreateMotivoBloqueioSaldoInput,
} from '../../../domain/model/estoque/motivo-bloqueio-saldo.model.js';
import {
  MOTIVO_BLOQUEIO_SALDO_REPOSITORY,
  type IMotivoBloqueioSaldoRepository,
} from '../../../domain/repositories/estoque/motivo-bloqueio-saldo.repository.js';

export type CreateMotivoBloqueioSaldoUseCaseInput = {
  data: CreateMotivoBloqueioSaldoInput;
};

@Injectable()
export class CreateMotivoBloqueioSaldoUseCase {
  constructor(
    @Inject(MOTIVO_BLOQUEIO_SALDO_REPOSITORY)
    private readonly motivoBloqueioSaldoRepository: IMotivoBloqueioSaldoRepository,
  ) {}

  async execute({ data }: CreateMotivoBloqueioSaldoUseCaseInput) {
    const parsed = CreateMotivoBloqueioSaldoInputSchema.parse(data);

    try {
      return await this.motivoBloqueioSaldoRepository.create(parsed);
    } catch (error) {
      this.mapConstraintError(error);
    }
  }

  private mapConstraintError(error: unknown): never {
    if (
      error instanceof Error &&
      error.message.includes('motivos_bloqueio_saldo_unidade_codigo_unique')
    ) {
      throw new BadRequestException(
        'Já existe um motivo de bloqueio com este código nesta unidade',
      );
    }

    throw error;
  }
}
