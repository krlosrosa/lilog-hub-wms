import { Inject, Injectable } from '@nestjs/common';

import type { ResumoMapasTransportesResponseDto } from '../../dtos/op-wms/demanda-separacao.dto.js';
import {
  DEMANDA_SEPARACAO_REPOSITORY,
  type IDemandaSeparacaoRepository,
} from '../../../domain/repositories/op-wms/demanda-separacao.repository.js';

type ResumoMapasTransportesInput = {
  unidadeId: string;
  transporteIds: string[];
};

@Injectable()
export class ResumoMapasTransportesUseCase {
  constructor(
    @Inject(DEMANDA_SEPARACAO_REPOSITORY)
    private readonly demandaSeparacaoRepository: IDemandaSeparacaoRepository,
  ) {}

  async execute(
    input: ResumoMapasTransportesInput,
  ): Promise<ResumoMapasTransportesResponseDto> {
    const items = await this.demandaSeparacaoRepository.resumoMapasTransportes(
      input.unidadeId,
      input.transporteIds,
    );

    return { items };
  }
}
