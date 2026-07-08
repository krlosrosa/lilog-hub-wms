import { Inject, Injectable } from '@nestjs/common';

import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';

@Injectable()
export class ListGruposDisponibilidadeEstoqueUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async execute(unidadeId: string) {
    const items =
      await this.estoqueRepository.listGruposDisponibilidadeEstoque(unidadeId);
    return { items };
  }
}
