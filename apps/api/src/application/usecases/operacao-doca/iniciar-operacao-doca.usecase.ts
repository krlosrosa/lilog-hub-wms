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

export type IniciarOperacaoDocaInput = {
  id: string;
  userId: number | null;
};

@Injectable()
export class IniciarOperacaoDocaUseCase {
  constructor(
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
    @Inject(OPERACAO_DOCA_REPOSITORY)
    private readonly operacaoDocaRepository: IOperacaoDocaRepository,
    private readonly docaEventPublisher: DocaEventPublisher,
  ) {}

  async execute({ id, userId }: IniciarOperacaoDocaInput) {
    const operacao = await this.operacaoDocaRepository.findById(id);

    if (!operacao) {
      throw new NotFoundException(`Operação "${id}" não encontrada`);
    }

    if (
      operacao.situacao !== 'agendada' &&
      operacao.situacao !== 'aguardando_veiculo'
    ) {
      throw new BadRequestException(
        'Apenas operações agendadas ou aguardando veículo podem ser iniciadas',
      );
    }

    const doca = await this.docaRepository.findById(operacao.docaId);

    if (!doca) {
      throw new NotFoundException(`Doca "${operacao.docaId}" não encontrada`);
    }

    if (doca.situacao === 'bloqueada') {
      throw new BadRequestException(
        'Não é permitido iniciar operação em doca bloqueada',
      );
    }

    if (doca.situacao === 'manutencao') {
      throw new BadRequestException(
        'Não é permitido iniciar operação em doca em manutenção',
      );
    }

    const activeOperacao = await this.operacaoDocaRepository.findActiveByDocaId(
      operacao.docaId,
    );

    if (
      activeOperacao &&
      activeOperacao.id !== operacao.id &&
      activeOperacao.situacao === 'em_execucao'
    ) {
      throw new BadRequestException(
        'Já existe uma operação em execução nesta doca',
      );
    }

    const now = new Date();

    const updated = await this.operacaoDocaRepository.update(id, {
      situacao: 'em_execucao',
      dataInicio: now,
    });

    if (!updated) {
      throw new NotFoundException(`Operação "${id}" não encontrada`);
    }

    await this.docaRepository.update(doca.id, { situacao: 'ocupada' });

    await this.docaEventPublisher.publish({
      type: DOCA_EVENT.OPERACAO_INICIADA,
      docaId: doca.id,
      unidadeId: doca.unidadeId,
      operacaoId: updated.id,
      userId,
    });

    return updated;
  }
}
