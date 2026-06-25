import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateOperacaoDocaInputSchema } from '../../../domain/model/doca/doca.model.js';
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

export type CreateOperacaoDocaUseCaseInput = {
  data: Parameters<typeof CreateOperacaoDocaInputSchema.parse>[0];
  userId: number | null;
};

@Injectable()
export class CreateOperacaoDocaUseCase {
  constructor(
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
    @Inject(OPERACAO_DOCA_REPOSITORY)
    private readonly operacaoDocaRepository: IOperacaoDocaRepository,
    private readonly docaEventPublisher: DocaEventPublisher,
  ) {}

  async execute({ data, userId }: CreateOperacaoDocaUseCaseInput) {
    const parsed = CreateOperacaoDocaInputSchema.parse(data);

    const doca = await this.docaRepository.findById(parsed.docaId);

    if (!doca) {
      throw new NotFoundException(`Doca "${parsed.docaId}" não encontrada`);
    }

    if (doca.situacao === 'bloqueada') {
      throw new BadRequestException(
        'Não é permitido agendar operação em doca bloqueada',
      );
    }

    if (doca.situacao === 'manutencao') {
      throw new BadRequestException(
        'Não é permitido agendar operação em doca em manutenção',
      );
    }

    const activeOperacao = await this.operacaoDocaRepository.findActiveByDocaId(
      parsed.docaId,
    );

    if (activeOperacao?.situacao === 'em_execucao') {
      throw new BadRequestException(
        'Já existe uma operação em execução nesta doca',
      );
    }

    const created = await this.operacaoDocaRepository.create(parsed);

    if (doca.situacao === 'disponivel') {
      await this.docaRepository.update(doca.id, { situacao: 'reservada' });
    }

    await this.docaEventPublisher.publish({
      type: DOCA_EVENT.OPERACAO_AGENDADA,
      docaId: doca.id,
      unidadeId: doca.unidadeId,
      operacaoId: created.id,
      userId,
    });

    return created;
  }
}
