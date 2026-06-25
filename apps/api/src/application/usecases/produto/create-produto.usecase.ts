import {
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';

import type { CreateProdutoInput } from '../../../domain/model/produto/produto.model.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';

@Injectable()
export class CreateProdutoUseCase {
  constructor(
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
  ) {}

  async execute(data: CreateProdutoInput) {
    const existingBySku = await this.produtoRepository.findBySku(data.sku);

    if (existingBySku) {
      throw new ConflictException(
        `Produto com SKU "${data.sku}" já existe`,
      );
    }

    const existingByProdutoId = await this.produtoRepository.findByProdutoId(
      data.produtoId,
    );

    if (existingByProdutoId) {
      throw new ConflictException(
        `Produto com ID "${data.produtoId}" já existe`,
      );
    }

    return this.produtoRepository.create(data);
  }
}
