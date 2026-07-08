import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';

import {
  PERFIL_TARIFA_REPOSITORY,
  type IPerfilTarifaRepository,
} from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import { invalidatePerfisTarifasCache } from './invalidate-perfis-tarifas-cache.js';

@Injectable()
export class DeletePerfilTarifaUseCase {
  constructor(
    @Inject(PERFIL_TARIFA_REPOSITORY)
    private readonly perfilTarifaRepository: IPerfilTarifaRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(id: string) {
    const existing = await this.perfilTarifaRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Perfil tarifa "${id}" não encontrado`);
    }

    await this.perfilTarifaRepository.delete(id);

    await invalidatePerfisTarifasCache(
      this.cacheManager,
      existing.unidadeId,
    );
  }
}
