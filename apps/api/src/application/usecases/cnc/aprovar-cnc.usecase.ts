import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { CncResponsavel } from '../../../domain/model/cnc/cnc.model.js';
import {
  CNC_REPOSITORY,
  type ICncRepository,
} from '../../../domain/repositories/cnc/cnc.repository.js';

export type AprovarCncInput = {
  cncId: string;
  aprovadorId: number;
  responsavel?: CncResponsavel;
  responsavelId?: string | null;
  valorDebito?: number | null;
  observacaoAprovador?: string | null;
};

@Injectable()
export class AprovarCncUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
  ) {}

  async execute(input: AprovarCncInput) {
    const cnc = await this.cncRepository.findById(input.cncId);

    if (!cnc) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    if (cnc.situacao !== 'pendente' && cnc.situacao !== 'em_analise') {
      throw new BadRequestException(
        'Aprovação só é permitida para CNCs pendentes ou em análise',
      );
    }

    const updated = await this.cncRepository.updateSituacao(input.cncId, {
      situacao: 'aprovado',
      aprovadorId: input.aprovadorId,
      dataAprovacao: new Date(),
      observacaoAprovador: input.observacaoAprovador ?? null,
      responsavel: input.responsavel,
      responsavelId: input.responsavelId,
      valorDebito: input.valorDebito,
    });

    if (!updated) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    return updated;
  }
}
