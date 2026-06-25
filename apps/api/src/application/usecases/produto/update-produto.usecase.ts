import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

import type { UpdateProdutoInput } from '../../../domain/model/produto/produto.model.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';
import { setAuditBefore } from '../../../shared/utils/audit-context.js';

@Injectable({ scope: Scope.REQUEST })
export class UpdateProdutoUseCase {
  constructor(
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    @Inject(REQUEST) private readonly request: unknown,
  ) {}

  async execute(id: string, data: UpdateProdutoInput) {
    const existing = await this.produtoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Produto "${id}" não encontrado`);
    }

    setAuditBefore(this.request, existing);

    if (data.sku && data.sku !== existing.sku) {
      const skuConflict = await this.produtoRepository.findBySku(data.sku);

      if (skuConflict) {
        throw new ConflictException(
          `Produto com SKU "${data.sku}" já existe`,
        );
      }
    }

    if (data.produtoId && data.produtoId !== existing.produtoId) {
      const produtoIdConflict = await this.produtoRepository.findByProdutoId(
        data.produtoId,
      );

      if (produtoIdConflict) {
        throw new ConflictException(
          `Produto com ID "${data.produtoId}" já existe`,
        );
      }
    }

    const updated = await this.produtoRepository.update(id, data);

    if (!updated) {
      throw new NotFoundException(`Produto "${id}" não encontrado`);
    }

    return updated;
  }
}
