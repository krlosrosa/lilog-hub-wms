import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CNC_REPOSITORY,
  type ICncRepository,
} from '../../../domain/repositories/cnc/cnc.repository.js';

export type RejeitarCncInput = {
  cncId: string;
  aprovadorId: number;
  observacaoAprovador: string;
};

@Injectable()
export class RejeitarCncUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
  ) {}

  async execute(input: RejeitarCncInput) {
    const cnc = await this.cncRepository.findById(input.cncId);

    if (!cnc) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    if (cnc.situacao !== 'pendente' && cnc.situacao !== 'em_analise') {
      throw new BadRequestException(
        'Rejeição só é permitida para CNCs pendentes ou em análise',
      );
    }

    const updated = await this.cncRepository.updateSituacao(input.cncId, {
      situacao: 'rejeitado',
      aprovadorId: input.aprovadorId,
      dataAprovacao: new Date(),
      observacaoAprovador: input.observacaoAprovador,
    });

    if (!updated) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    return updated;
  }
}
