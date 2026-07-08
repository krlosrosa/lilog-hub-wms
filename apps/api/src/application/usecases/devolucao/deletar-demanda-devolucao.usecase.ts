import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import type { DeletarDemandaDevolucaoResponseDto } from '../../dtos/devolucao/buscar-demanda-devolucao.dto.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

type DeletarDemandaDevolucaoInput = {
  demandaId: string;
  unidadeId: string;
};

@Injectable()
export class DeletarDemandaDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
  ) {}

  async execute(
    input: DeletarDemandaDevolucaoInput,
  ): Promise<DeletarDemandaDevolucaoResponseDto> {
    const demanda = await this.devolucaoRepository.buscarDemanda({
      demandaId: input.demandaId,
      unidadeId: input.unidadeId,
    });

    if (!demanda) {
      throw new NotFoundException('Demanda de devolução não encontrada.');
    }

    if (demanda.status === 'concluida') {
      throw new BadRequestException(
        'Não é possível deletar demandas finalizadas.',
      );
    }

    const result = await this.devolucaoRepository.deletarDemanda(
      input.demandaId,
      input.unidadeId,
    );

    if (!result) {
      throw new NotFoundException('Demanda de devolução não encontrada.');
    }

    return {
      id: result.id,
      codigoDemanda: result.codigoDemanda,
    };
  }
}
