import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ENDERECO_EVENT } from '../../../domain/model/endereco/endereco.events.js';
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';
import { EnderecoEventPublisher } from '../../services/endereco-event.publisher.js';

export type StartEnderecoInventoryInput = {
  id: string;
  motivo?: string;
  userId: number | null;
};

@Injectable()
export class StartEnderecoInventoryUseCase {
  constructor(
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
    private readonly enderecoEventPublisher: EnderecoEventPublisher,
  ) {}

  async execute({ id, motivo, userId }: StartEnderecoInventoryInput) {
    const existing = await this.enderecoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Endereço "${id}" não encontrado`);
    }

    if (existing.status === 'inativo') {
      throw new BadRequestException('Endereço inativo não pode entrar em inventário');
    }

    if (existing.status === 'inventario') {
      return existing;
    }

    const updated = await this.enderecoRepository.update(id, {
      status: 'inventario',
    });

    if (!updated) {
      throw new NotFoundException(`Endereço "${id}" não encontrado`);
    }

    await this.enderecoEventPublisher.publish({
      type: ENDERECO_EVENT.ENTROU_INVENTARIO,
      enderecoId: updated.id,
      unidadeId: updated.unidadeId,
      enderecoMascarado: updated.enderecoMascarado,
      userId,
      motivo,
    });

    return updated;
  }
}
