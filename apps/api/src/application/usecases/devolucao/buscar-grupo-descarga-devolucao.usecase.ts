import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { BuscarGrupoDescargaResponseDto } from '../../dtos/devolucao/grupo-descarga-devolucao.dto.js';
import {
  DEVOLUCAO_REPOSITORY,
  type BuscarGrupoDescargaFilter,
  type IDevolucaoRepository,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

@Injectable()
export class BuscarGrupoDescargaDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
  ) {}

  async execute(
    filter: BuscarGrupoDescargaFilter,
  ): Promise<BuscarGrupoDescargaResponseDto> {
    const result = await this.devolucaoRepository.buscarGrupoDescarga(filter);

    if (!result) {
      throw new NotFoundException('Grupo de descarga não encontrado.');
    }

    return {
      id: result.id,
      codigoGrupo: result.codigoGrupo,
      placaDescarga: result.placaDescarga,
      doca: result.doca,
      cargaSegregada: result.cargaSegregada,
      paletesEsperados: result.paletesEsperados,
      observacao: result.observacao,
      status: result.status,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      startedAt: result.startedAt?.toISOString() ?? null,
      finishedAt: result.finishedAt?.toISOString() ?? null,
      demandas: result.demandas,
      itensEsperados: result.itensEsperados,
      itensNaoContabeis: result.itensNaoContabeis.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
