import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';

export type DesbloquearSaldoEnderecoUseCaseInput = {
  saldoEnderecoId: string;
  observacao?: string | null;
  operatorId?: number | null;
};

@Injectable()
export class DesbloquearSaldoEnderecoUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async execute(input: DesbloquearSaldoEnderecoUseCaseInput) {
    try {
      return await this.estoqueRepository.desbloquearSaldoEndereco({
        saldoEnderecoId: input.saldoEnderecoId,
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
