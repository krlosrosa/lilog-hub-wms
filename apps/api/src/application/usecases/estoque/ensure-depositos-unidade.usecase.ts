import { Inject, Injectable } from '@nestjs/common';

import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';

@Injectable()
export class EnsureDepositosUnidadeUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  execute(unidadeId: string) {
    return this.estoqueRepository.ensureDepositosUnidade(unidadeId);
  }
}
