import { Inject, Injectable } from '@nestjs/common';

import type { ListarMapasLotesResponseDto } from '../../dtos/expedicao/salvar-mapas.dto.js';
import {
  MAPA_LOTE_REPOSITORY,
  type IMapaLoteRepository,
} from '../../../domain/repositories/expedicao/mapa-lote.repository.js';

type ListarMapasLotesInput = {
  unidadeId: string;
  transporteIds: string[];
};

@Injectable()
export class ListarMapasLotesUseCase {
  constructor(
    @Inject(MAPA_LOTE_REPOSITORY)
    private readonly mapaLoteRepository: IMapaLoteRepository,
  ) {}

  async execute(
    input: ListarMapasLotesInput,
  ): Promise<ListarMapasLotesResponseDto> {
    const lotes = await this.mapaLoteRepository.listarPorTransporteIds(
      input.unidadeId,
      input.transporteIds,
    );

    return {
      lotes: lotes.map((lote) => ({
        id: lote.id,
        unidadeId: lote.unidadeId,
        resumo: lote.resumo,
        configuracaoImpressaoId: lote.configuracaoImpressaoId,
        criadoPor: lote.criadoPor,
        createdAt: lote.createdAt.toISOString(),
        transporteIds: lote.transporteIds,
      })),
    };
  }
}
