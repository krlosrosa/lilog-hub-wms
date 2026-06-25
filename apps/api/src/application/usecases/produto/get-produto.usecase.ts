import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';

@Injectable()
export class GetProdutoUseCase {
  constructor(
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
  ) {}

  async execute(id: string) {
    const produto = await this.produtoRepository.findById(id);

    if (!produto) {
      throw new NotFoundException(`Produto "${id}" não encontrado`);
    }

    return produto;
  }
}
