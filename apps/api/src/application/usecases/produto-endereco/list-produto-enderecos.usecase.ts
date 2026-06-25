import { Inject, Injectable } from '@nestjs/common';

import type { ListProdutoEnderecosFilter } from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';
import {
  PRODUTO_ENDERECO_REPOSITORY,
  type IProdutoEnderecoRepository,
} from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';

@Injectable()
export class ListProdutoEnderecosUseCase {
  constructor(
    @Inject(PRODUTO_ENDERECO_REPOSITORY)
    private readonly produtoEnderecoRepository: IProdutoEnderecoRepository,
  ) {}

  execute(filter: ListProdutoEnderecosFilter) {
    return this.produtoEnderecoRepository.list(filter);
  }
}
