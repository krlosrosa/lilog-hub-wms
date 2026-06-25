import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';

@Injectable()
export class GetEnderecoUseCase {
  constructor(
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
  ) {}

  async execute(id: string) {
    const endereco = await this.enderecoRepository.findById(id);

    if (!endereco) {
      throw new NotFoundException(`Endereço "${id}" não encontrado`);
    }

    return endereco;
  }
}
