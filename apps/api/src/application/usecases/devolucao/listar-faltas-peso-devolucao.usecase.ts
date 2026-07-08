import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { ListarFaltasPesoResponseDto } from '../../dtos/devolucao/falta-peso-devolucao.dto.js';
import { mapFaltaPesoToResponse } from '../../services/devolucao/map-falta-peso-response.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
  type ListarFaltasPesoFilter,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

@Injectable()
export class ListarFaltasPesoDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
  ) {}

  async execute(
    filter: ListarFaltasPesoFilter,
  ): Promise<ListarFaltasPesoResponseDto> {
    const demanda = await this.devolucaoRepository.buscarDemanda({
      demandaId: filter.demandaId,
      unidadeId: filter.unidadeId,
    });

    if (!demanda) {
      throw new NotFoundException('Demanda de devolução não encontrada.');
    }

    const faltasPeso = await this.devolucaoRepository.listarFaltasPeso(filter);

    return {
      faltasPeso: faltasPeso.map(mapFaltaPesoToResponse),
    };
  }
}
