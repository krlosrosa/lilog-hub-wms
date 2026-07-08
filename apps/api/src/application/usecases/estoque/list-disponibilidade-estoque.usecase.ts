import { Inject, Injectable } from '@nestjs/common';

import type { ListDisponibilidadeEstoqueFilter } from '../../../domain/repositories/estoque/estoque.repository.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';

function mapDisponibilidadeResponse(
  result: Awaited<ReturnType<IEstoqueRepository['listDisponibilidadeEstoque']>>,
) {
  return {
    items: result.items.map((item) => ({
      ...item,
      validade: item.validade?.toISOString() ?? null,
      updatedAt: item.updatedAt.toISOString(),
    })),
    total: result.total,
    page: result.page,
    limit: result.limit,
    summary: result.summary,
  };
}

@Injectable()
export class ListDisponibilidadeEstoqueUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async execute(filter: ListDisponibilidadeEstoqueFilter) {
    const result =
      await this.estoqueRepository.listDisponibilidadeEstoque(filter);
    return mapDisponibilidadeResponse(result);
  }
}
