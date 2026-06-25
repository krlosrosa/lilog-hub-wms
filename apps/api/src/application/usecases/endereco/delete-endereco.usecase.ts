import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';

@Injectable()
export class DeleteEnderecoUseCase {
  constructor(
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.enderecoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Endereço "${id}" não encontrado`);
    }

    const hasStock = await this.enderecoRepository.hasStock(id);

    if (hasStock) {
      throw new BadRequestException(
        'Não é permitido excluir endereço com estoque armazenado',
      );
    }

    const hasHistory = await this.enderecoRepository.hasMovementHistory(id);

    if (hasHistory) {
      throw new BadRequestException(
        'Não é permitido excluir endereço utilizado em movimentações históricas',
      );
    }

    await this.enderecoRepository.delete(id);
  }
}
