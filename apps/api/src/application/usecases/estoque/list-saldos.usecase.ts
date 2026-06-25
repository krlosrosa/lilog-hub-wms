import { Inject, Injectable } from '@nestjs/common';

import type { DepositoCodigo } from '../../../domain/model/estoque/deposito.model.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';

export type ListSaldosUseCaseInput = {
  unidadeId: string;
  depositoCodigo?: DepositoCodigo;
  produtoId?: string;
};

@Injectable()
export class ListSaldosUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  execute(input: ListSaldosUseCaseInput) {
    return this.estoqueRepository.listSaldos(input);
  }
}
