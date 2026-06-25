import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { MapaLoteDetalheDto } from '../../dtos/expedicao/salvar-mapas.dto.js';
import {
  MAPA_LOTE_REPOSITORY,
  type IMapaLoteRepository,
} from '../../../domain/repositories/expedicao/mapa-lote.repository.js';

type ObterMapaLoteInput = {
  loteId: string;
  unidadeId: string;
};

@Injectable()
export class ObterMapaLoteUseCase {
  constructor(
    @Inject(MAPA_LOTE_REPOSITORY)
    private readonly mapaLoteRepository: IMapaLoteRepository,
  ) {}

  async execute(input: ObterMapaLoteInput): Promise<MapaLoteDetalheDto> {
    const lote = await this.mapaLoteRepository.obterPorId(
      input.loteId,
      input.unidadeId,
    );

    if (!lote) {
      throw new NotFoundException('Lote de mapas não encontrado.');
    }

    return {
      id: lote.id,
      unidadeId: lote.unidadeId,
      config: lote.config,
      payload: lote.payload,
      resumo: lote.resumo,
      configuracaoImpressaoId: lote.configuracaoImpressaoId,
      templatesHtml: lote.templatesHtml,
      criadoPor: lote.criadoPor,
      createdAt: lote.createdAt.toISOString(),
    };
  }
}
