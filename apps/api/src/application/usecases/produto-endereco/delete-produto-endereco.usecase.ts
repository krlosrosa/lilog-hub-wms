import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  PRODUTO_ENDERECO_REPOSITORY,
  type IProdutoEnderecoRepository,
} from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';

@Injectable()
export class DeleteProdutoEnderecoUseCase {
  constructor(
    @Inject(PRODUTO_ENDERECO_REPOSITORY)
    private readonly produtoEnderecoRepository: IProdutoEnderecoRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.produtoEnderecoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Alocação "${id}" não encontrada`);
    }

    await this.produtoEnderecoRepository.delete(id);
  }
}
