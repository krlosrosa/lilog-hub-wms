import { Inject, Injectable } from '@nestjs/common';

import type { ListPerfisTarifasFilter } from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import {
  PERFIL_TARIFA_REPOSITORY,
  type IPerfilTarifaRepository,
} from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import { mapPerfilTarifaToResponse } from '../../dtos/perfil-tarifa/map-perfil-tarifa-response.js';

@Injectable()
export class ListPerfisTarifasUseCase {
  constructor(
    @Inject(PERFIL_TARIFA_REPOSITORY)
    private readonly perfilTarifaRepository: IPerfilTarifaRepository,
  ) {}

  async execute(filter: ListPerfisTarifasFilter) {
    const items = await this.perfilTarifaRepository.list(filter);

    return {
      items: items.map(mapPerfilTarifaToResponse),
    };
  }
}
