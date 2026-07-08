import { Inject, Injectable } from '@nestjs/common';

import type { ListHistoricoProdutoFilter } from '../../../domain/repositories/estoque/estoque.repository.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';

function mapHistoricoResponse(
  result: Awaited<ReturnType<IEstoqueRepository['listHistoricoProduto']>>,
) {
  return {
    items: result.items.map((item) => ({
      ...item,
      validade: item.validade?.toISOString() ?? null,
      occurredAt: item.occurredAt.toISOString(),
    })),
    total: result.total,
    page: result.page,
    limit: result.limit,
  };
}

@Injectable()
export class ListHistoricoProdutoUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async execute(filter: ListHistoricoProdutoFilter) {
    const result = await this.estoqueRepository.listHistoricoProduto(filter);
    return mapHistoricoResponse(result);
  }
}
