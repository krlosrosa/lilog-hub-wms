import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  PRODUTO_ENDERECO_REPOSITORY,
  type IProdutoEnderecoRepository,
} from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';

@Injectable()
export class GetProdutoEnderecoUseCase {
  constructor(
    @Inject(PRODUTO_ENDERECO_REPOSITORY)
    private readonly produtoEnderecoRepository: IProdutoEnderecoRepository,
  ) {}

  async execute(id: string) {
    const record = await this.produtoEnderecoRepository.findById(id);

    if (!record) {
      throw new NotFoundException(`Alocação "${id}" não encontrada`);
    }

    return record;
  }
}
