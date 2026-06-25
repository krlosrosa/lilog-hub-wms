import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DOCA_EVENT } from '../../../domain/model/doca/doca.events.js';
import {
  DOCA_REPOSITORY,
  type IDocaRepository,
} from '../../../domain/repositories/doca/doca.repository.js';
import { DocaEventPublisher } from '../../services/doca-event.publisher.js';

export type BlockDocaInput = {
  id: string;
  motivo?: string;
  userId: number | null;
};

@Injectable()
export class BlockDocaUseCase {
  constructor(
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
    private readonly docaEventPublisher: DocaEventPublisher,
  ) {}

  async execute({ id, motivo, userId }: BlockDocaInput) {
    const existing = await this.docaRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Doca "${id}" não encontrada`);
    }

    if (existing.situacao === 'ocupada') {
      throw new BadRequestException(
        'Doca ocupada não pode ser bloqueada',
      );
    }

    if (existing.situacao === 'bloqueada') {
      return existing;
    }

    const updated = await this.docaRepository.update(id, {
      situacao: 'bloqueada',
    });

    if (!updated) {
      throw new NotFoundException(`Doca "${id}" não encontrada`);
    }

    await this.docaEventPublisher.publish({
      type: DOCA_EVENT.BLOQUEADA,
      docaId: updated.id,
      unidadeId: updated.unidadeId,
      userId,
      motivo,
    });

    return updated;
  }
}
