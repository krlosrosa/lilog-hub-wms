import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { mapMapaGrupoCorteToDto } from '../../mappers/corte-operacional/corte-operacional.mapper.js';
import type { MapaGrupoCorteResponseDto } from '../../dtos/corte-operacional/corte-operacional.dto.js';
import {
  CORTE_OPERACIONAL_REPOSITORY,
  type ICorteOperacionalRepository,
} from '../../../domain/repositories/corte-operacional/corte-operacional.repository.js';

@Injectable()
export class BuscarMapaGrupoPorCodigoUseCase {
  constructor(
    @Inject(CORTE_OPERACIONAL_REPOSITORY)
    private readonly corteOperacionalRepository: ICorteOperacionalRepository,
  ) {}

  async execute(input: {
    codigo: string;
    unidadeId: string;
  }): Promise<MapaGrupoCorteResponseDto> {
    const mapa = await this.corteOperacionalRepository.findMapaGrupoPorCodigo(
      input.codigo.trim(),
      input.unidadeId,
    );

    if (!mapa) {
      throw new NotFoundException(
        `Mapa-grupo com código "${input.codigo}" não encontrado`,
      );
    }

    if (mapa.processo !== 'separacao') {
      throw new NotFoundException(
        'Mapa-grupo não pertence ao processo de separação',
      );
    }

    return mapMapaGrupoCorteToDto(mapa);
  }
}
