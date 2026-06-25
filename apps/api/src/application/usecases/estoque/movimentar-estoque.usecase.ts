import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import type {
  AjustarSaldoInput,
  EstornarPorDocumentoInput,
  RegistrarEntradaInput,
  TransferirDepositoInput,
} from '../../../domain/model/estoque/movimentacao-estoque.model.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';

@Injectable()
export class MovimentarEstoqueUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  registrarEntrada(input: RegistrarEntradaInput) {
    return this.execute(() => this.estoqueRepository.registrarEntrada(input));
  }

  transferirDeposito(input: TransferirDepositoInput) {
    return this.execute(() => this.estoqueRepository.transferirDeposito(input));
  }

  ajustarSaldo(input: AjustarSaldoInput) {
    return this.execute(() => this.estoqueRepository.ajustarSaldo(input));
  }

  estornarPorDocumento(input: EstornarPorDocumentoInput) {
    return this.execute(() =>
      this.estoqueRepository.estornarPorDocumento(input),
    );
  }

  private async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
