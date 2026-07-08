import { Inject, Injectable } from '@nestjs/common';

import type { ListDisponibilidadeEstoqueAgrupadoFilter } from '../../../domain/repositories/estoque/estoque.repository.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';

function mapDisponibilidadeAgrupadoResponse(
  result: Awaited<
    ReturnType<IEstoqueRepository['listDisponibilidadeEstoqueAgrupado']>
  >,
) {
  return {
    items: result.items.map((item) => ({
      ...item,
      validadeMaisProxima: item.validadeMaisProxima?.toISOString() ?? null,
      updatedAt: item.updatedAt.toISOString(),
    })),
    total: result.total,
    page: result.page,
    limit: result.limit,
    summary: result.summary,
  };
}

@Injectable()
export class ListDisponibilidadeEstoqueAgrupadoUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async execute(filter: ListDisponibilidadeEstoqueAgrupadoFilter) {
    const result =
      await this.estoqueRepository.listDisponibilidadeEstoqueAgrupado(filter);
    return mapDisponibilidadeAgrupadoResponse(result);
  }
}
