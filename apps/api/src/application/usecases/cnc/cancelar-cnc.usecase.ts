import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CNC_EVENTO } from '../../../domain/model/cnc/cnc.model.js';
import {
  CNC_REPOSITORY,
  type ICncRepository,
} from '../../../domain/repositories/cnc/cnc.repository.js';
import { CncEventPublisher } from '../../services/cnc-event.publisher.js';

export type CancelarCncUseCaseInput = {
  cncId: string;
  userId: number;
  observacao: string;
};

@Injectable()
export class CancelarCncUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
    private readonly cncEventPublisher: CncEventPublisher,
  ) {}

  async execute(input: CancelarCncUseCaseInput) {
    const cnc = await this.cncRepository.findById(input.cncId);

    if (!cnc) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    if (cnc.situacao !== 'pendente' && cnc.situacao !== 'em_analise') {
      throw new BadRequestException(
        'Cancelamento só é permitido para CNCs pendentes ou em análise',
      );
    }

    const updated = await this.cncRepository.cancelar(input.cncId, {
      encerradoPorUserId: input.userId,
      encerradoEm: new Date(),
    });

    if (!updated) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    await this.cncEventPublisher.publishRegistrarEvento({
      cncId: input.cncId,
      tipoEvento: CNC_EVENTO.CANCELADA,
      situacaoAnterior: cnc.situacao,
      situacaoNova: 'cancelada',
      descricao: input.observacao,
      criadoPorUserId: input.userId,
    });

    return updated;
  }
}
