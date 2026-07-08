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

export type ConcluirTratativaCncUseCaseInput = {
  cncId: string;
  tratativaId: string;
  concluidaPorUserId: number;
};

@Injectable()
export class ConcluirTratativaCncUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
    private readonly cncEventPublisher: CncEventPublisher,
  ) {}

  async execute(input: ConcluirTratativaCncUseCaseInput) {
    const cnc = await this.cncRepository.findById(input.cncId);

    if (!cnc) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    if (cnc.situacao !== 'em_analise') {
      throw new BadRequestException(
        'Tratativas só podem ser concluídas em CNCs em análise',
      );
    }

    const tratativas = await this.cncRepository.listTratativas(input.cncId);
    const existing = tratativas.find(
      (tratativa) => tratativa.id === input.tratativaId,
    );

    if (!existing) {
      throw new NotFoundException(
        `Tratativa "${input.tratativaId}" não encontrada`,
      );
    }

    if (existing.status === 'concluida') {
      throw new BadRequestException('Tratativa já está concluída');
    }

    const tratativa = await this.cncRepository.concluirTratativa(
      input.cncId,
      input.tratativaId,
      {
        concluidaPorUserId: input.concluidaPorUserId,
        concluidaEm: new Date(),
      },
    );

    if (!tratativa) {
      throw new NotFoundException(
        `Tratativa "${input.tratativaId}" não encontrada`,
      );
    }

    await this.cncEventPublisher.publishRegistrarEvento({
      cncId: input.cncId,
      tipoEvento: CNC_EVENTO.TRATATIVA_CONCLUIDA,
      descricao: `Tratativa ${tratativa.tipo} concluída`,
      metadata: {
        tratativaId: tratativa.id,
      },
      criadoPorUserId: input.concluidaPorUserId,
    });

    return tratativa;
  }
}
