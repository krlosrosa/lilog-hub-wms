import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';

import type { AjustarSaldoEnderecoBodyDto } from '../../../application/dtos/estoque/estoque.dto.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';

export type AjustarSaldoEnderecoUseCaseInput = AjustarSaldoEnderecoBodyDto & {
  saldoEnderecoId: string;
  operatorId?: number | null;
};

@Injectable()
export class AjustarSaldoEnderecoUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async execute(input: AjustarSaldoEnderecoUseCaseInput) {
    try {
      const saldo = await this.estoqueRepository.ajustarSaldoEndereco({
        saldoEnderecoId: input.saldoEnderecoId,
        novaQuantidade: input.novaQuantidade,
        motivo: input.motivo,
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
