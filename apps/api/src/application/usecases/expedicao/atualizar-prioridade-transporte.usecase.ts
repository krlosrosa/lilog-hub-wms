import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  TRANSPORTE_REPOSITORY,
  type AtualizarPrioridadeTransporteResult,
  type ITransporteRepository,
  type NivelPrioridadeTransporte,
} from '../../../domain/repositories/expedicao/transporte.repository.js';

export type AtualizarPrioridadeTransporteInput = {
  id: string;
  unidadeId: string;
  isPrioridade: boolean;
  nivelPrioridade?: NivelPrioridadeTransporte;
};

@Injectable()
export class AtualizarPrioridadeTransporteUseCase {
  constructor(
    @Inject(TRANSPORTE_REPOSITORY)
    private readonly transporteRepository: ITransporteRepository,
  ) {}

  async execute(
    input: AtualizarPrioridadeTransporteInput,
  ): Promise<AtualizarPrioridadeTransporteResult> {
    if (input.isPrioridade && !input.nivelPrioridade) {
      throw new BadRequestException(
        'Informe o nível de prioridade quando o transporte for marcado como prioridade.',
      );
    }

    const result = await this.transporteRepository.atualizarPrioridade({
      id: input.id,
      unidadeId: input.unidadeId,
      isPrioridade: input.isPrioridade,
      nivelPrioridade: input.isPrioridade
        ? (input.nivelPrioridade ?? null)
        : null,
    });

    if (!result) {
      throw new NotFoundException('Transporte não encontrado.');
    }

    return result;
  }
}
