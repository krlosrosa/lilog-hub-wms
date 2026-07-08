import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import {
  MOTIVO_BLOQUEIO_SALDO_REPOSITORY,
  type IMotivoBloqueioSaldoRepository,
} from '../../../domain/repositories/estoque/motivo-bloqueio-saldo.repository.js';

export type BloquearSaldoEnderecoUseCaseInput = {
  saldoEnderecoId: string;
  motivoBloqueioId: string;
  quantidade?: number;
  observacao?: string | null;
  operatorId?: number | null;
};

@Injectable()
export class BloquearSaldoEnderecoUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
    @Inject(MOTIVO_BLOQUEIO_SALDO_REPOSITORY)
    private readonly motivoBloqueioSaldoRepository: IMotivoBloqueioSaldoRepository,
  ) {}

  async execute(input: BloquearSaldoEnderecoUseCaseInput) {
    const motivo = await this.motivoBloqueioSaldoRepository.findById(
      input.motivoBloqueioId,
    );

    if (!motivo) {
      throw new NotFoundException(
        `Motivo de bloqueio "${input.motivoBloqueioId}" não encontrado`,
      );
    }

    if (!motivo.ativo) {
      throw new BadRequestException('Motivo de bloqueio está inativo');
    }

    try {
      return await this.estoqueRepository.bloquearSaldoEndereco({
        saldoEnderecoId: input.saldoEnderecoId,
        motivoBloqueioId: input.motivoBloqueioId,
        quantidade: input.quantidade,
        observacao: input.observacao,
        operatorId: input.operatorId,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
