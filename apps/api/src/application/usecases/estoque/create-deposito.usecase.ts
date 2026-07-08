import {
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  ESTOQUE_REPOSITORY,
  type CreateDepositoInput,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import { EnsureDepositosUnidadeUseCase } from './ensure-depositos-unidade.usecase.js';

@Injectable()
export class CreateDepositoUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
    private readonly ensureDepositosUnidadeUseCase: EnsureDepositosUnidadeUseCase,
  ) {}

  async execute(input: CreateDepositoInput) {
    await this.ensureDepositosUnidadeUseCase.execute(input.unidadeId);

    const codigo = input.codigo.trim().toUpperCase();
    const existing = await this.estoqueRepository.findDepositoByUnidadeAndCodigo(
      input.unidadeId,
      codigo,
    );

    if (existing) {
      throw new ConflictException(
        `Depósito com código "${codigo}" já existe nesta unidade`,
      );
    }

    return this.estoqueRepository.createDeposito({
      ...input,
      codigo,
      nome: input.nome.trim(),
    });
  }
}
