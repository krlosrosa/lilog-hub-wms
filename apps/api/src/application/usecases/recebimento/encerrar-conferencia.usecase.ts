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
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import { calcularDivergencias } from '../../../domain/services/recebimento-divergencia.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';

export type EncerrarConferenciaUseCaseInput = {
  recebimentoId: string;
  userId: number | null;
};

@Injectable()
export class EncerrarConferenciaUseCase {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
  ) {}

  async execute({ recebimentoId, userId }: EncerrarConferenciaUseCaseInput) {
    const recebimento = await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      throw new NotFoundException(`Recebimento "${recebimentoId}" não encontrado`);
    }

    if (recebimento.situacao !== 'em_recebimento') {
      throw new BadRequestException(
        'Conferência só pode ser encerrada com recebimento em andamento',
      );
    }

    const preRecebimento = await this.preRecebimentoRepository.findById(
      recebimento.preRecebimentoId,
    );

    if (!preRecebimento) {
      throw new NotFoundException('Pré-recebimento vinculado não encontrado');
    }

    const itensRecebidos =
      await this.recebimentoRepository.findItemsByRecebimento(recebimentoId);

    if (itensRecebidos.length === 0) {
      throw new BadRequestException(
        'Não é possível encerrar conferência sem itens conferidos',
      );
    }

    await this.recebimentoRepository.clearDivergencias(recebimentoId);

    const divergenciasCalculadas = calcularDivergencias(
      preRecebimento.itens,
      itensRecebidos,
    );

    for (const divergencia of divergenciasCalculadas) {
      await this.recebimentoRepository.createDivergencia({
        recebimentoId,
        ...divergencia,
      });

      await this.recebimentoEventPublisher.publish({
        type: RECEBIMENTO_EVENT.DIVERGENCIA_IDENTIFICADA,
        preRecebimentoId: preRecebimento.id,
        recebimentoId,
        unidadeId: preRecebimento.unidadeId,
        userId,
        metadata: {
          tipoDivergencia: divergencia.tipoDivergencia,
          produtoId: divergencia.produtoId ?? null,
        },
      });
    }

    const dataFim = new Date();
    const novaSituacao =
      divergenciasCalculadas.length > 0 ? 'aguardando_aprovacao' : 'aprovado';

    const updated = await this.recebimentoRepository.updateStatus(
      recebimentoId,
      novaSituacao,
      dataFim,
    );

    await this.preRecebimentoRepository.updateSituacao(
      preRecebimento.id,
      novaSituacao,
    );

    const details = await this.recebimentoRepository.findById(recebimentoId);

    return details ?? updated;
  }
}
