import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CNC_EVENTO,
  type CncResponsavel,
  type CncTratativaTipo,
} from '../../../domain/model/cnc/cnc.model.js';
import {
  CNC_REPOSITORY,
  type ICncRepository,
} from '../../../domain/repositories/cnc/cnc.repository.js';
import { CncEventPublisher } from '../../services/cnc-event.publisher.js';

export type AdicionarTratativaCncUseCaseInput = {
  cncId: string;
  tipo: CncTratativaTipo;
  descricao: string;
  responsavelTipo: CncResponsavel;
  prazo?: string | null;
  criadoPorUserId: number;
};

@Injectable()
export class AdicionarTratativaCncUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
    private readonly cncEventPublisher: CncEventPublisher,
  ) {}

  async execute(input: AdicionarTratativaCncUseCaseInput) {
    const cnc = await this.cncRepository.findById(input.cncId);

    if (!cnc) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    if (cnc.situacao !== 'em_analise') {
      throw new BadRequestException(
        'Tratativas só podem ser adicionadas em CNCs em análise',
      );
    }

    const tratativa = await this.cncRepository.addTratativa({
      cncId: input.cncId,
      tipo: input.tipo,
      descricao: input.descricao,
      responsavelTipo: input.responsavelTipo,
      prazo: input.prazo ? new Date(input.prazo) : null,
      criadoPorUserId: input.criadoPorUserId,
    });

    await this.cncEventPublisher.publishRegistrarEvento({
      cncId: input.cncId,
      tipoEvento: CNC_EVENTO.TRATATIVA_ADICIONADA,
      descricao: `Tratativa ${input.tipo} adicionada`,
      metadata: {
        tratativaId: tratativa.id,
        responsavelTipo: input.responsavelTipo,
      },
      criadoPorUserId: input.criadoPorUserId,
    });

    return tratativa;
  }
}
