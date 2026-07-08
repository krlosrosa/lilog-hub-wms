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
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';

export type RemovePesagemRecebimentoUseCaseInput = {
  recebimentoId: string;
  pesagemId: string;
  userId: number | null;
};

@Injectable()
export class RemovePesagemRecebimentoUseCase {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
  ) {}

  async execute({
    recebimentoId,
    pesagemId,
    userId,
  }: RemovePesagemRecebimentoUseCaseInput) {
    const recebimento = await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      throw new NotFoundException(`Recebimento "${recebimentoId}" não encontrado`);
    }

    if (recebimento.situacao !== 'em_conferencia') {
      throw new BadRequestException(
        'Remoção de pesagem só é permitida com recebimento em andamento',
      );
    }

    const preRecebimento = await this.preRecebimentoRepository.findById(
      recebimento.preRecebimentoId,
    );

    if (!preRecebimento) {
      throw new NotFoundException('Pré-recebimento vinculado não encontrado');
    }

    const result = await this.recebimentoRepository.removePesagem(
      recebimentoId,
      pesagemId,
    );

    if (!result.removed) {
      throw new NotFoundException(
        `Pesagem "${pesagemId}" não encontrada neste recebimento`,
      );
    }

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.ITEM_CONFERIDO,
      preRecebimentoId: recebimento.preRecebimentoId,
      recebimentoId: recebimento.id,
      unidadeId: preRecebimento.unidadeId,
      userId,
      metadata: {
        pesagemId,
        produtoId: result.produtoId,
        removed: true,
        removedCount: 1,
      },
    });

    return result;
  }
}
