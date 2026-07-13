import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { canTransitionPreRecebimento } from '../../../domain/model/recebimento/recebimento.model.js';
import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import {
  IMPEDIMENTO_REPOSITORY,
  type IImpedimentoRepository,
} from '../../../domain/repositories/recebimento/impedimento.repository.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';

export type RetomarConferenciaImpedidaUseCaseInput = {
  preRecebimentoId: string;
  userId: number | null;
};

@Injectable()
export class RetomarConferenciaImpedidaUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(IMPEDIMENTO_REPOSITORY)
    private readonly impedimentoRepository: IImpedimentoRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
  ) {}

  async execute({ preRecebimentoId, userId }: RetomarConferenciaImpedidaUseCaseInput) {
    const preRecebimento = await this.preRecebimentoRepository.findById(preRecebimentoId);

    if (!preRecebimento) {
      throw new NotFoundException(
        `Pré-recebimento "${preRecebimentoId}" não encontrado`,
      );
    }

    if (
      preRecebimento.situacao === 'liberado_para_conferencia' ||
      preRecebimento.situacao === 'em_conferencia'
    ) {
      const impedimento = await this.impedimentoRepository.findByPreRecebimentoId(
        preRecebimentoId,
      );
      return {
        preRecebimentoId,
        impedimentoId: impedimento?.id ?? preRecebimentoId,
      };
    }

    if (preRecebimento.situacao !== 'impedido') {
      throw new BadRequestException(
        'Só é possível retomar demandas com impedimento registrado.',
      );
    }

    if (
      !canTransitionPreRecebimento(
        preRecebimento.situacao,
        'liberado_para_conferencia',
      )
    ) {
      throw new BadRequestException(
        'Não é possível retomar a conferência neste momento.',
      );
    }

    const impedimento = await this.impedimentoRepository.findByPreRecebimentoId(
      preRecebimentoId,
    );

    if (!impedimento) {
      throw new BadRequestException(
        'Nenhum impedimento encontrado para retomar a conferência.',
      );
    }

    await this.preRecebimentoRepository.updateSituacao(
      preRecebimentoId,
      'liberado_para_conferencia',
    );

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.CONFERENCIA_RETOMADA,
      preRecebimentoId,
      unidadeId: preRecebimento.unidadeId,
      userId,
      metadata: {
        impedimentoId: impedimento.id,
      },
    });

    return {
      preRecebimentoId,
      impedimentoId: impedimento.id,
    };
  }
}
