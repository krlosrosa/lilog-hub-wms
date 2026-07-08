import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  RecepcionarCarroInputSchema,
  type RecepcionarCarroInput,
} from '../../../domain/model/recebimento/recebimento.model.js';
import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';

export type RecepcionarCarroUseCaseInput = {
  id: string;
  data: RecepcionarCarroInput;
  userId: number | null;
};

@Injectable()
export class RecepcionarCarroUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
  ) {}

  async execute({ id, data, userId }: RecepcionarCarroUseCaseInput) {
    const parsed = RecepcionarCarroInputSchema.parse(data);

    const existing = await this.preRecebimentoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Pré-recebimento "${id}" não encontrado`);
    }

    if (existing.situacao !== 'agendado') {
      throw new BadRequestException(
        'Recepção só é permitida para cargas agendadas',
      );
    }

    const updated = await this.preRecebimentoRepository.recepcionarCarro(
      id,
      parsed,
    );

    if (!updated) {
      throw new NotFoundException(`Pré-recebimento "${id}" não encontrado`);
    }

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.PRE_RECEBIMENTO_ATUALIZADO,
      preRecebimentoId: updated.id,
      unidadeId: updated.unidadeId,
      userId,
      metadata: {
        acao: 'recepcionar_carro',
        dataChegada: updated.dataChegada?.toISOString() ?? null,
        grauPrioridade: updated.grauPrioridade,
      },
    });

    return updated;
  }
}
