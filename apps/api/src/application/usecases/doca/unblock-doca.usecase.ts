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

export type UnblockDocaInput = {
  id: string;
  userId: number | null;
};

@Injectable()
export class UnblockDocaUseCase {
  constructor(
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
    private readonly docaEventPublisher: DocaEventPublisher,
  ) {}

  async execute({ id, userId }: UnblockDocaInput) {
    const existing = await this.docaRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Doca "${id}" não encontrada`);
    }

    if (existing.situacao !== 'bloqueada') {
      throw new BadRequestException('Doca não está bloqueada');
    }

    const updated = await this.docaRepository.update(id, {
      situacao: 'disponivel',
    });

    if (!updated) {
      throw new NotFoundException(`Doca "${id}" não encontrada`);
    }

    await this.docaEventPublisher.publish({
      type: DOCA_EVENT.DESBLOQUEADA,
      docaId: updated.id,
      unidadeId: updated.unidadeId,
      userId,
    });

    return updated;
  }
}
