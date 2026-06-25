import { Inject, Injectable } from '@nestjs/common';

import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
  type ListProdutosFilter,
} from '../../../domain/repositories/produto/produto.repository.js';

@Injectable()
export class ListProdutosUseCase {
  constructor(
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
  ) {}

  execute(filter: ListProdutosFilter) {
    return this.produtoRepository.list(filter);
  }
}
