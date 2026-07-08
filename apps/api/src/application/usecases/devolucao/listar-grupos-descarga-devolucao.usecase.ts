import { Inject, Injectable } from '@nestjs/common';

import type { ListarGruposDescargaResponseDto } from '../../dtos/devolucao/grupo-descarga-devolucao.dto.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
  type ListarGruposDescargaFilter,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

@Injectable()
export class ListarGruposDescargaDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
  ) {}

  async execute(
    filter: ListarGruposDescargaFilter,
  ): Promise<ListarGruposDescargaResponseDto> {
    const result = await this.devolucaoRepository.listarGruposDescarga(filter);

    return {
      grupos: result.grupos.map((grupo) => ({
        ...grupo,
        createdAt: grupo.createdAt.toISOString(),
        updatedAt: grupo.updatedAt.toISOString(),
        startedAt: grupo.startedAt?.toISOString() ?? null,
        finishedAt: grupo.finishedAt?.toISOString() ?? null,
      })),
    };
  }
}
