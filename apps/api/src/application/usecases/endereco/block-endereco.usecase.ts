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

export type BlockEnderecoInput = {
  id: string;
  motivo?: string;
  userId: number | null;
};

@Injectable()
export class BlockEnderecoUseCase {
  constructor(
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
    private readonly enderecoEventPublisher: EnderecoEventPublisher,
  ) {}

  async execute({ id, motivo, userId }: BlockEnderecoInput) {
    const existing = await this.enderecoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Endereço "${id}" não encontrado`);
    }

    if (existing.status === 'inativo') {
      throw new BadRequestException('Endereço inativo não pode ser bloqueado');
    }

    if (existing.status === 'bloqueado') {
      return existing;
    }

    const updated = await this.enderecoRepository.update(id, {
      status: 'bloqueado',
    });

    if (!updated) {
      throw new NotFoundException(`Endereço "${id}" não encontrado`);
    }

    await this.enderecoEventPublisher.publish({
      type: ENDERECO_EVENT.BLOQUEADO,
      enderecoId: updated.id,
      centroId: updated.centroId,
      enderecoMascarado: updated.enderecoMascarado,
      userId,
      motivo,
    });

    return updated;
  }
}
