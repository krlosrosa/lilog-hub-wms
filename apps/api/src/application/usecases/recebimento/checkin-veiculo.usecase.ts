import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';

export type CheckinVeiculoUseCaseInput = {
  id: string;
  userId: number | null;
};

@Injectable()
export class CheckinVeiculoUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
  ) {}

  async execute({ id, userId }: CheckinVeiculoUseCaseInput) {
    const existing = await this.preRecebimentoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Pré-recebimento "${id}" não encontrado`);
    }

    if (existing.situacao !== 'agendado') {
      throw new BadRequestException(
        'Check-in só é permitido para cargas agendadas',
      );
    }

    const dataChegada = new Date();
    const updated = await this.preRecebimentoRepository.updateSituacao(
      id,
      'veiculo_chegou',
      dataChegada,
    );

    if (!updated) {
      throw new NotFoundException(`Pré-recebimento "${id}" não encontrado`);
    }

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.VEICULO_CHEGOU,
      preRecebimentoId: updated.id,
      unidadeId: updated.unidadeId,
      userId,
      metadata: { dataChegada: dataChegada.toISOString() },
    });

    return updated;
  }
}
