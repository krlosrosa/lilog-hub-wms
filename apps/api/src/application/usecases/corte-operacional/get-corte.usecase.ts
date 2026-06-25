import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { mapCorteDetalheToDto } from '../../mappers/corte-operacional/corte-operacional.mapper.js';
import type { CorteDetalheResponseDto } from '../../dtos/corte-operacional/corte-operacional.dto.js';
import {
  CORTE_OPERACIONAL_REPOSITORY,
  type ICorteOperacionalRepository,
} from '../../../domain/repositories/corte-operacional/corte-operacional.repository.js';

@Injectable()
export class GetCorteUseCase {
  constructor(
    @Inject(CORTE_OPERACIONAL_REPOSITORY)
    private readonly corteOperacionalRepository: ICorteOperacionalRepository,
  ) {}

  async execute(input: {
    corteId: string;
    unidadeId: string;
  }): Promise<CorteDetalheResponseDto> {
    const corte = await this.corteOperacionalRepository.findCorteById(
      input.corteId,
      input.unidadeId,
    );

    if (!corte) {
      throw new NotFoundException('Corte operacional não encontrado');
    }

    return mapCorteDetalheToDto(corte);
  }
}
