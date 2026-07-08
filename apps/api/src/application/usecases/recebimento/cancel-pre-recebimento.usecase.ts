import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { canCancelPreRecebimento } from '../../../domain/model/recebimento/recebimento.model.js';
import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';

export type CancelPreRecebimentoUseCaseInput = {
  id: string;
  userId: number | null;
};

@Injectable()
export class CancelPreRecebimentoUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
  ) {}

  async execute({ id, userId }: CancelPreRecebimentoUseCaseInput) {
    const existing = await this.preRecebimentoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Pré-recebimento "${id}" não encontrado`);
    }

    if (!canCancelPreRecebimento(existing.situacao)) {
      throw new BadRequestException(
        'Pré-recebimento não pode ser cancelado na situação atual',
      );
    }

    const cancelled = await this.preRecebimentoRepository.cancel(id);

    if (!cancelled) {
      throw new NotFoundException(`Pré-recebimento "${id}" não encontrado`);
    }

    const recebimento =
      await this.recebimentoRepository.findByPreRecebimentoId(id);

    if (recebimento) {
      await this.recebimentoRepository.updateStatus(
        recebimento.id,
        'cancelado',
        new Date(),
      );
    }

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.PRE_RECEBIMENTO_CANCELADO,
      preRecebimentoId: cancelled.id,
      recebimentoId: recebimento?.id,
      unidadeId: cancelled.unidadeId,
      userId,
    });

    return cancelled;
  }
}
