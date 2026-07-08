import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  MOTIVO_BLOQUEIO_SALDO_REPOSITORY,
  type IMotivoBloqueioSaldoRepository,
} from '../../../domain/repositories/estoque/motivo-bloqueio-saldo.repository.js';

@Injectable()
export class DeleteMotivoBloqueioSaldoUseCase {
  constructor(
    @Inject(MOTIVO_BLOQUEIO_SALDO_REPOSITORY)
    private readonly motivoBloqueioSaldoRepository: IMotivoBloqueioSaldoRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.motivoBloqueioSaldoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Motivo de bloqueio "${id}" não encontrado`);
    }

    if (existing.sistema) {
      throw new BadRequestException(
        'Motivos de sistema não podem ser removidos',
      );
    }

    try {
      await this.motivoBloqueioSaldoRepository.delete(id);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('violates foreign key constraint') ||
          error.message.includes('saldos_endereco_motivo_bloqueio_id'))
      ) {
        throw new BadRequestException(
          'Motivo de bloqueio em uso por saldos e não pode ser removido',
        );
      }

      throw error;
    }
  }
}
