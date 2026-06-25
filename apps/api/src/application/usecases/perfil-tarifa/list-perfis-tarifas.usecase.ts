import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

import type { ListPerfisTarifasFilter } from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import {
  PERFIL_TARIFA_REPOSITORY,
  type IPerfilTarifaRepository,
} from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import { mapPerfilTarifaToResponse } from '../../dtos/perfil-tarifa/map-perfil-tarifa-response.js';

const CACHE_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class ListPerfisTarifasUseCase {
  constructor(
    @Inject(PERFIL_TARIFA_REPOSITORY)
    private readonly perfilTarifaRepository: IPerfilTarifaRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(filter: ListPerfisTarifasFilter) {
    const cacheKey = `perfis-tarifa:${JSON.stringify(filter)}`;
    const cached = await this.cacheManager.get<{
      items: ReturnType<typeof mapPerfilTarifaToResponse>[];
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const items = await this.perfilTarifaRepository.list(filter);
    const response = {
      items: items.map(mapPerfilTarifaToResponse),
    };

    await this.cacheManager.set(cacheKey, response, CACHE_TTL_MS);

    return response;
  }
}
