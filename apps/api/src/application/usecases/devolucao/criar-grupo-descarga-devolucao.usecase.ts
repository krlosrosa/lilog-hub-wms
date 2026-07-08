import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { CriarGrupoDescargaResponseDto } from '../../dtos/devolucao/grupo-descarga-devolucao.dto.js';
import {
  DEVOLUCAO_REPOSITORY,
  type CriarGrupoDescargaInput,
  type IDevolucaoRepository,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

@Injectable()
export class CriarGrupoDescargaDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
  ) {}

  async execute(
    input: CriarGrupoDescargaInput,
  ): Promise<CriarGrupoDescargaResponseDto> {
    if (input.demandaIds.length < 1) {
      throw new BadRequestException(
        'Selecione ao menos uma demanda para agrupar.',
      );
    }

    try {
      const result = await this.devolucaoRepository.criarGrupoDescarga(input);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
