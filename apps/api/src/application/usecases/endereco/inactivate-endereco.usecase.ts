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

export type InactivateEnderecoInput = {
  id: string;
  motivo?: string;
  userId: number | null;
};

@Injectable()
export class InactivateEnderecoUseCase {
  constructor(
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
    private readonly enderecoEventPublisher: EnderecoEventPublisher,
  ) {}

  async execute({ id, motivo, userId }: InactivateEnderecoInput) {
    const existing = await this.enderecoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Endereço "${id}" não encontrado`);
    }

    if (existing.status === 'inativo') {
      return existing;
    }

    const hasStock = await this.enderecoRepository.hasStock(id);

    if (hasStock) {
      throw new BadRequestException(
        'Não é permitido inativar endereço com estoque armazenado',
      );
    }

    const updated = await this.enderecoRepository.update(id, {
      status: 'inativo',
    });

    if (!updated) {
      throw new NotFoundException(`Endereço "${id}" não encontrado`);
    }

    await this.enderecoEventPublisher.publish({
      type: ENDERECO_EVENT.INATIVADO,
      enderecoId: updated.id,
      unidadeId: updated.unidadeId,
      enderecoMascarado: updated.enderecoMascarado,
      userId,
      motivo,
    });

    return updated;
  }
}
