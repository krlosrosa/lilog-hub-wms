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

export type IniciarAnaliseCncUseCaseInput = {
  cncId: string;
  analistaId: number;
};

@Injectable()
export class IniciarAnaliseCncUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
    private readonly cncEventPublisher: CncEventPublisher,
  ) {}

  async execute({ cncId, analistaId }: IniciarAnaliseCncUseCaseInput) {
    const cnc = await this.cncRepository.findById(cncId);

    if (!cnc) {
      throw new NotFoundException(`CNC "${cncId}" não encontrada`);
    }

    if (cnc.situacao !== 'pendente') {
      throw new BadRequestException(
        'Análise só pode ser iniciada para CNCs pendentes',
      );
    }

    const updated = await this.cncRepository.iniciarAnalise(cncId, {
      analistaId,
      iniciadoEm: new Date(),
    });

    if (!updated) {
      throw new NotFoundException(`CNC "${cncId}" não encontrada`);
    }

    await this.cncEventPublisher.publishRegistrarEvento({
      cncId,
      tipoEvento: CNC_EVENTO.ANALISE_INICIADA,
      situacaoAnterior: cnc.situacao,
      situacaoNova: 'em_analise',
      descricao: `Análise iniciada para CNC ${cnc.numero}`,
      criadoPorUserId: analistaId,
    });

    return updated;
  }
}
