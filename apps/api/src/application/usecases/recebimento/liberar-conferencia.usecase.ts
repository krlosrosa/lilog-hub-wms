import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  LiberarConferenciaInputSchema,
  type LiberarConferenciaInput,
} from '../../../domain/model/recebimento/recebimento.model.js';
import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import {
  DOCA_REPOSITORY,
  type IDocaRepository,
} from '../../../domain/repositories/doca/doca.repository.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';

export type LiberarConferenciaUseCaseInput = {
  id: string;
  data: LiberarConferenciaInput;
  userId: number | null;
};

@Injectable()
export class LiberarConferenciaUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
  ) {}

  async execute({ id, data, userId }: LiberarConferenciaUseCaseInput) {
    const parsed = LiberarConferenciaInputSchema.parse(data);
    const existing = await this.preRecebimentoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Pré-recebimento "${id}" não encontrado`);
    }

    if (existing.situacao !== 'aguardando') {
      throw new BadRequestException(
        'Liberação só é permitida para cargas aguardando conferência',
      );
    }

    const doca = await this.docaRepository.findById(parsed.docaId);

    if (!doca) {
      throw new NotFoundException(`Doca "${parsed.docaId}" não encontrada`);
    }

    if (doca.unidadeId !== existing.unidadeId) {
      throw new BadRequestException(
        'Doca informada não pertence à unidade do pré-recebimento',
      );
    }

    if (doca.situacao !== 'disponivel') {
      throw new BadRequestException(
        'Doca selecionada não está disponível para liberação',
      );
    }

    const dataChegada = existing.dataChegada ?? new Date();
    const updated = await this.preRecebimentoRepository.liberarConferencia(
      id,
      parsed.docaId,
      dataChegada,
    );

    if (!updated) {
      throw new NotFoundException(`Pré-recebimento "${id}" não encontrado`);
    }

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.CONFERENCIA_LIBERADA,
      preRecebimentoId: updated.id,
      unidadeId: updated.unidadeId,
      userId,
      metadata: {
        dataChegada: dataChegada.toISOString(),
        docaId: parsed.docaId,
      },
    });

    return updated;
  }
}
