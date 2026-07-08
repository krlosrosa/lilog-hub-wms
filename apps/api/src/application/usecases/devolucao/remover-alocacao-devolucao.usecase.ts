import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { RemoverAlocacaoDevolucaoResponseDto } from '../../dtos/devolucao/recursos-devolucao-sessao.dto.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

@Injectable()
export class RemoverAlocacaoDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
  ) {}

  async execute(
    alocacaoId: string,
    unidadeId: string,
  ): Promise<RemoverAlocacaoDevolucaoResponseDto> {
    const result = await this.devolucaoRepository.removerAlocacao(
      alocacaoId,
      unidadeId,
    );

    if (!result) {
      throw new NotFoundException('Alocação de devolução não encontrada.');
    }

    return result;
  }
}
