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
import {
  OPERACAO_DOCA_REPOSITORY,
  type IOperacaoDocaRepository,
} from '../../../domain/repositories/operacao-doca/operacao-doca.repository.js';
import { DocaEventPublisher } from '../../services/doca-event.publisher.js';

export type CancelarOperacaoDocaInput = {
  id: string;
  userId: number | null;
};

@Injectable()
export class CancelarOperacaoDocaUseCase {
  constructor(
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
    @Inject(OPERACAO_DOCA_REPOSITORY)
    private readonly operacaoDocaRepository: IOperacaoDocaRepository,
    private readonly docaEventPublisher: DocaEventPublisher,
  ) {}

  async execute({ id, userId }: CancelarOperacaoDocaInput) {
    const operacao = await this.operacaoDocaRepository.findById(id);

    if (!operacao) {
      throw new NotFoundException(`Operação "${id}" não encontrada`);
    }

    if (
      operacao.situacao === 'finalizada' ||
      operacao.situacao === 'cancelada'
    ) {
      throw new BadRequestException(
        'Operação já finalizada ou cancelada não pode ser cancelada',
      );
    }

    const doca = await this.docaRepository.findById(operacao.docaId);

    if (!doca) {
      throw new NotFoundException(`Doca "${operacao.docaId}" não encontrada`);
    }

    const updated = await this.operacaoDocaRepository.update(id, {
      situacao: 'cancelada',
    });

    if (!updated) {
      throw new NotFoundException(`Operação "${id}" não encontrada`);
    }

    if (doca.situacao === 'ocupada' || doca.situacao === 'reservada') {
      const pendingOperacao =
        await this.operacaoDocaRepository.findActiveByDocaId(doca.id);

      const nextSituacao =
        pendingOperacao && pendingOperacao.id !== updated.id
          ? pendingOperacao.situacao === 'em_execucao'
            ? 'ocupada'
            : 'reservada'
          : 'disponivel';

      await this.docaRepository.update(doca.id, { situacao: nextSituacao });
    }

    await this.docaEventPublisher.publish({
      type: DOCA_EVENT.OPERACAO_CANCELADA,
      docaId: doca.id,
      unidadeId: doca.unidadeId,
      operacaoId: updated.id,
      userId,
    });

    return updated;
  }
}
