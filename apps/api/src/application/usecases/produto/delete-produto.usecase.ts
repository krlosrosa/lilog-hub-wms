import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';

@Injectable()
export class DeleteProdutoUseCase {
  constructor(
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
  ) {}

  async execute(produtoId: string) {
    const existing = await this.produtoRepository.findByProdutoId(produtoId);

    if (!existing) {
      throw new NotFoundException(`Produto "${produtoId}" não encontrado`);
    }

    await this.produtoRepository.delete(produtoId);
  }
}
