import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  RegistrarImpedimentoInputSchema,
  canTransitionPreRecebimento,
  type RegistrarImpedimentoInput,
} from '../../../domain/model/recebimento/recebimento.model.js';
import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import {
  IMPEDIMENTO_REPOSITORY,
  type IImpedimentoRepository,
} from '../../../domain/repositories/recebimento/impedimento.repository.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';

export type RegistrarImpedimentoRecebimentoUseCaseInput = {
  data: RegistrarImpedimentoInput;
  userId: number | null;
};

@Injectable()
export class RegistrarImpedimentoRecebimentoUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(IMPEDIMENTO_REPOSITORY)
    private readonly impedimentoRepository: IImpedimentoRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
  ) {}

  async execute({ data, userId }: RegistrarImpedimentoRecebimentoUseCaseInput) {
    const parsed = RegistrarImpedimentoInputSchema.parse(data);
    const preRecebimento = await this.preRecebimentoRepository.findById(
      parsed.preRecebimentoId,
    );

    if (!preRecebimento) {
      throw new NotFoundException(
        `Pré-recebimento "${parsed.preRecebimentoId}" não encontrado`,
      );
    }

    if (preRecebimento.situacao === 'impedido') {
      const existing = await this.impedimentoRepository.findByPreRecebimentoId(
        parsed.preRecebimentoId,
      );
      if (existing) {
        throw new ConflictException('Impedimento já registrado para esta carga');
      }
    }

    const registradoPorId =
      parsed.registradoPorId ??
      (userId != null
        ? (await this.userRepository.findById(userId))?.funcionarioId ?? null
        : null);

    if (!canTransitionPreRecebimento(preRecebimento.situacao, 'impedido')) {
      throw new BadRequestException(
        `Não é possível registrar impedimento a partir da situação "${preRecebimento.situacao}"`,
      );
    }

    const impedimento = await this.impedimentoRepository.create({
      preRecebimentoId: parsed.preRecebimentoId,
      tipo: parsed.tipo,
      descricao: parsed.descricao,
      photoCount: parsed.photoCount,
      registradoPorId,
    });

    await this.preRecebimentoRepository.updateSituacao(
      parsed.preRecebimentoId,
      'impedido',
    );

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.RECEBIMENTO_IMPEDIDO,
      preRecebimentoId: parsed.preRecebimentoId,
      unidadeId: preRecebimento.unidadeId,
      userId,
      metadata: {
        impedimentoId: impedimento.id,
        tipo: parsed.tipo,
        photoCount: parsed.photoCount,
      },
    });

    return impedimento;
  }
}
