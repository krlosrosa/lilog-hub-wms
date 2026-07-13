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

export type UpdateObservacaoCncUseCaseInput = {
  cncId: string;
  observacao: string | null;
};

@Injectable()
export class UpdateObservacaoCncUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
  ) {}

  async execute(input: UpdateObservacaoCncUseCaseInput) {
    const cnc = await this.cncRepository.findById(input.cncId);

    if (!cnc) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    if (cnc.situacao === 'encerrada' || cnc.situacao === 'cancelada') {
      throw new BadRequestException(
        'Observação não pode ser alterada em CNC encerrada ou cancelada',
      );
    }

    const updated = await this.cncRepository.updateObservacao(input.cncId, {
      observacao: input.observacao,
    });

    if (!updated) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    return updated;
  }
}
