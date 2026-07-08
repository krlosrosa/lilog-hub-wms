import { Inject, Injectable } from '@nestjs/common';

import type { ListSaldosEnderecoFilter } from '../../../domain/repositories/estoque/estoque.repository.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';

@Injectable()
export class ListSaldosEnderecoUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  execute(filter: ListSaldosEnderecoFilter) {
    return this.estoqueRepository.listSaldosEndereco(filter);
  }
}
