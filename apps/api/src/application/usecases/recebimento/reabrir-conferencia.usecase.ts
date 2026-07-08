import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  canTransitionPreRecebimento,
} from '../../../domain/model/recebimento/recebimento.model.js';
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

export type ReabrirConferenciaUseCaseInput = {
  recebimentoId: string;
  userId: number | null;
};

@Injectable()
export class ReabrirConferenciaUseCase {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
  ) {}

  async execute({ recebimentoId, userId }: ReabrirConferenciaUseCaseInput) {
    const recebimento = await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      throw new NotFoundException(`Recebimento "${recebimentoId}" não encontrado`);
    }

    if (recebimento.situacao !== 'conferido') {
      throw new BadRequestException(
        'Só é possível reabrir demandas com status Conferido.',
      );
    }

    const preRecebimento = await this.preRecebimentoRepository.findById(
      recebimento.preRecebimentoId,
    );

    if (!preRecebimento) {
      throw new NotFoundException('Pré-recebimento vinculado não encontrado');
    }

    if (
      !canTransitionPreRecebimento(preRecebimento.situacao, 'em_conferencia')
    ) {
      throw new BadRequestException(
        'Não é possível reabrir a conferência neste momento.',
      );
    }

    await this.recebimentoRepository.clearDivergencias(recebimentoId);

    const updated = await this.recebimentoRepository.updateStatus(
      recebimentoId,
      'em_conferencia',
      null,
    );

    await this.preRecebimentoRepository.updateSituacao(
      preRecebimento.id,
      'em_conferencia',
    );

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.CONFERENCIA_REABERTA,
      preRecebimentoId: preRecebimento.id,
      recebimentoId,
      unidadeId: preRecebimento.unidadeId,
      userId,
    });

    const details = await this.recebimentoRepository.findById(recebimentoId);

    return details ?? updated;
  }
}
