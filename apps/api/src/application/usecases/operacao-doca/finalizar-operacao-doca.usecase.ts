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

export type FinalizarOperacaoDocaInput = {
  id: string;
  userId: number | null;
};

@Injectable()
export class FinalizarOperacaoDocaUseCase {
  constructor(
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
    @Inject(OPERACAO_DOCA_REPOSITORY)
    private readonly operacaoDocaRepository: IOperacaoDocaRepository,
    private readonly docaEventPublisher: DocaEventPublisher,
  ) {}

  async execute({ id, userId }: FinalizarOperacaoDocaInput) {
    const operacao = await this.operacaoDocaRepository.findById(id);

    if (!operacao) {
      throw new NotFoundException(`Operação "${id}" não encontrada`);
    }

    if (operacao.situacao !== 'em_execucao') {
      throw new BadRequestException(
        'Apenas operações em execução podem ser finalizadas',
      );
    }

    const doca = await this.docaRepository.findById(operacao.docaId);

    if (!doca) {
      throw new NotFoundException(`Doca "${operacao.docaId}" não encontrada`);
    }

    const now = new Date();

    const updated = await this.operacaoDocaRepository.update(id, {
      situacao: 'finalizada',
      dataFim: now,
    });

    if (!updated) {
      throw new NotFoundException(`Operação "${id}" não encontrada`);
    }

    const pendingOperacao =
      await this.operacaoDocaRepository.findActiveByDocaId(doca.id);

    const nextSituacao =
      pendingOperacao && pendingOperacao.id !== updated.id
        ? 'reservada'
        : 'disponivel';

    await this.docaRepository.update(doca.id, { situacao: nextSituacao });

    await this.docaEventPublisher.publish({
      type: DOCA_EVENT.OPERACAO_FINALIZADA,
      docaId: doca.id,
      unidadeId: doca.unidadeId,
      operacaoId: updated.id,
      userId,
    });

    await this.docaEventPublisher.publish({
      type: DOCA_EVENT.VEICULO_LIBERADO,
      docaId: doca.id,
      unidadeId: doca.unidadeId,
      operacaoId: updated.id,
      userId,
    });

    return updated;
  }
}
