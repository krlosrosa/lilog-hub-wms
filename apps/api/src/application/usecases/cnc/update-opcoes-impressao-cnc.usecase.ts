import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { CncOpcoesImpressao } from '../../../domain/model/cnc/cnc.model.js';
import {
  CNC_REPOSITORY,
  type ICncRepository,
} from '../../../domain/repositories/cnc/cnc.repository.js';

export type UpdateOpcoesImpressaoCncUseCaseInput = {
  cncId: string;
  opcoesImpressao: CncOpcoesImpressao;
};

@Injectable()
export class UpdateOpcoesImpressaoCncUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
  ) {}

  async execute(input: UpdateOpcoesImpressaoCncUseCaseInput) {
    const cnc = await this.cncRepository.findById(input.cncId);

    if (!cnc) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    if (cnc.situacao === 'encerrada' || cnc.situacao === 'cancelada') {
      throw new BadRequestException(
        'Opções de impressão não podem ser alteradas em CNC encerrada ou cancelada',
      );
    }

    const updated = await this.cncRepository.updateOpcoesImpressao(input.cncId, {
      opcoesImpressao: input.opcoesImpressao,
    });

    if (!updated) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    return updated;
  }
}
