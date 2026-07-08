import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';

import type { TransferirSaldoEnderecoBodyDto } from '../../../application/dtos/estoque/estoque.dto.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';

export type TransferirSaldoEnderecoUseCaseInput =
  TransferirSaldoEnderecoBodyDto & {
    saldoEnderecoId: string;
    operatorId?: number | null;
  };

@Injectable()
export class TransferirSaldoEnderecoUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async execute(input: TransferirSaldoEnderecoUseCaseInput) {
    try {
      const saldo = await this.estoqueRepository.transferirSaldoEndereco({
        saldoEnderecoId: input.saldoEnderecoId,
        enderecoDestinoId: input.enderecoDestinoId,
        quantidade: input.quantidade,
        observacao: input.observacao,
        operatorId: input.operatorId,
      });

      return {
        ...saldo,
        validade: saldo.validade?.toISOString() ?? null,
        bloqueadoEm: saldo.bloqueadoEm?.toISOString() ?? null,
        updatedAt: saldo.updatedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
