import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CNC_EVENTO, type CncResponsavel } from '../../../domain/model/cnc/cnc.model.js';
import {
  CNC_REPOSITORY,
  type ICncRepository,
} from '../../../domain/repositories/cnc/cnc.repository.js';
import { CncEventPublisher } from '../../services/cnc-event.publisher.js';

export type EncerrarCncUseCaseInput = {
  cncId: string;
  encerradoPorUserId: number;
  responsavel?: CncResponsavel;
  responsavelId?: string | null;
  valorDebito?: number | null;
  acaoImediata?: string | null;
  acaoCorretiva?: string | null;
};

@Injectable()
export class EncerrarCncUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
    private readonly cncEventPublisher: CncEventPublisher,
  ) {}

  async execute(input: EncerrarCncUseCaseInput) {
    const cnc = await this.cncRepository.findById(input.cncId);

    if (!cnc) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    if (cnc.situacao !== 'em_analise') {
      throw new BadRequestException(
        'Encerramento só é permitido para CNCs em análise',
      );
    }

    const quantidadeTratativas = await this.cncRepository.countTratativas(
      input.cncId,
    );

    if (quantidadeTratativas === 0) {
      throw new BadRequestException(
        'É necessário registrar ao menos uma tratativa antes de encerrar a CNC',
      );
    }

    const tratativasPendentes =
      await this.cncRepository.countTratativasPendentes(input.cncId);

    if (tratativasPendentes > 0) {
      throw new BadRequestException(
        'Todas as tratativas devem estar concluídas antes de encerrar a CNC',
      );
    }

    const updated = await this.cncRepository.encerrar(input.cncId, {
      encerradoPorUserId: input.encerradoPorUserId,
      encerradoEm: new Date(),
      responsavel: input.responsavel,
      responsavelId: input.responsavelId,
      valorDebito: input.valorDebito,
      acaoImediata: input.acaoImediata,
      acaoCorretiva: input.acaoCorretiva,
    });

    if (!updated) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    await this.cncEventPublisher.publishRegistrarEvento({
      cncId: input.cncId,
      tipoEvento: CNC_EVENTO.ENCERRADA,
      situacaoAnterior: cnc.situacao,
      situacaoNova: 'encerrada',
      descricao: `CNC ${cnc.numero} encerrada`,
      metadata: {
        responsavel: input.responsavel ?? cnc.responsavel,
        valorDebito: input.valorDebito ?? null,
      },
      criadoPorUserId: input.encerradoPorUserId,
    });

    return updated;
  }
}
