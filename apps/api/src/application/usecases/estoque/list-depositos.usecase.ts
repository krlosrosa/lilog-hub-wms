import { Inject, Injectable } from '@nestjs/common';

import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import { EnsureDepositosUnidadeUseCase } from './ensure-depositos-unidade.usecase.js';

@Injectable()
export class ListDepositosUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
    private readonly ensureDepositosUnidadeUseCase: EnsureDepositosUnidadeUseCase,
  ) {}

  async execute(unidadeId: string) {
    await this.ensureDepositosUnidadeUseCase.execute(unidadeId);
    return this.estoqueRepository.listDepositos(unidadeId);
  }
}
