import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
  type UpdateDepositoInput,
} from '../../../domain/repositories/estoque/estoque.repository.js';

@Injectable()
export class UpdateDepositoUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async execute(id: string, data: UpdateDepositoInput) {
    const existing = await this.estoqueRepository.findDepositoById(id);

    if (!existing) {
      throw new NotFoundException(`Depósito "${id}" não encontrado`);
    }

    if (existing.sistema) {
      const restrictedFields = ['nome', 'ativo'] as const;
      const hasRestrictedChange = restrictedFields.some(
        (field) => data[field] !== undefined,
      );

      if (hasRestrictedChange) {
        throw new BadRequestException(
          'Depósitos de sistema não permitem alteração de nome ou status',
        );
      }
    }

    const updated = await this.estoqueRepository.updateDeposito(id, data);

    if (!updated) {
      throw new NotFoundException(`Depósito "${id}" não encontrado`);
    }

    return updated;
  }
}
