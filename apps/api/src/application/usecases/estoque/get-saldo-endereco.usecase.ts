import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';

@Injectable()
export class GetSaldoEnderecoUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async execute(saldoEnderecoId: string) {
    const saldo =
      await this.estoqueRepository.findSaldoEnderecoById(saldoEnderecoId);

    if (!saldo) {
      throw new NotFoundException(
        `Saldo por endereço "${saldoEnderecoId}" não encontrado`,
      );
    }

    return {
      ...saldo,
      produtoDescricao: saldo.produtoNome,
      validade: saldo.validade?.toISOString() ?? null,
      bloqueadoEm: saldo.bloqueadoEm?.toISOString() ?? null,
      updatedAt: saldo.updatedAt.toISOString(),
    };
  }
}
