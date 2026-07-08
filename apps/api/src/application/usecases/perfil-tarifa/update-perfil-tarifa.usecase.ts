import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';

import { UpdatePerfilTarifaInputSchema } from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';
import {
  PERFIL_TARIFA_REPOSITORY,
  type IPerfilTarifaRepository,
} from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import { mapPerfilTarifaToResponse } from '../../dtos/perfil-tarifa/map-perfil-tarifa-response.js';
import { invalidatePerfisTarifasCache } from './invalidate-perfis-tarifas-cache.js';

@Injectable()
export class UpdatePerfilTarifaUseCase {
  constructor(
    @Inject(PERFIL_TARIFA_REPOSITORY)
    private readonly perfilTarifaRepository: IPerfilTarifaRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(id: string, data: unknown) {
    const parsed = UpdatePerfilTarifaInputSchema.parse(data);

    const existing = await this.perfilTarifaRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Perfil tarifa "${id}" não encontrado`);
    }

    const updated = await this.perfilTarifaRepository.update(id, parsed);

    if (!updated) {
      throw new NotFoundException(`Perfil tarifa "${id}" não encontrado`);
    }

    await invalidatePerfisTarifasCache(
      this.cacheManager,
      existing.unidadeId,
    );

    return mapPerfilTarifaToResponse(updated);
  }
}
