import { Inject, Injectable } from '@nestjs/common';

import type { ListSlottingProdutoEnderecosFilter } from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';
import {
  PRODUTO_ENDERECO_REPOSITORY,
  type IProdutoEnderecoRepository,
} from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';

@Injectable()
export class ListSlottingProdutoEnderecosUseCase {
  constructor(
    @Inject(PRODUTO_ENDERECO_REPOSITORY)
    private readonly produtoEnderecoRepository: IProdutoEnderecoRepository,
  ) {}

  execute(filter: ListSlottingProdutoEnderecosFilter) {
    return this.produtoEnderecoRepository.listSlotting(filter);
  }
}
