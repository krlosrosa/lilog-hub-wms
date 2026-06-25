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

  async execute(id: string) {
    const existing = await this.produtoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Produto "${id}" não encontrado`);
    }

    await this.produtoRepository.delete(id);
  }
}
