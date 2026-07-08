import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Cache } from 'cache-manager';

import { CreatePerfilTarifaInputSchema } from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';
import {
  PERFIL_TARIFA_REPOSITORY,
  type IPerfilTarifaRepository,
} from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import { mapPerfilTarifaToResponse } from '../../dtos/perfil-tarifa/map-perfil-tarifa-response.js';
import { invalidatePerfisTarifasCache } from './invalidate-perfis-tarifas-cache.js';

@Injectable()
export class CreatePerfilTarifaUseCase {
  constructor(
    @Inject(PERFIL_TARIFA_REPOSITORY)
    private readonly perfilTarifaRepository: IPerfilTarifaRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(data: unknown) {
    const parsed = CreatePerfilTarifaInputSchema.parse(data);

    const unidade = await this.unidadeRepository.findById(parsed.unidadeId);

    if (!unidade) {
      throw new NotFoundException(
        `Unidade "${parsed.unidadeId}" não encontrada`,
      );
    }

    const existing = await this.perfilTarifaRepository.findByUnidadeAndRavexId(
      parsed.unidadeId,
      parsed.idRavex,
    );

    if (existing) {
      throw new ConflictException(
        `Perfil com ID Ravex ${parsed.idRavex} já existe nesta unidade`,
      );
    }

    const created = await this.perfilTarifaRepository.create(parsed);

    await invalidatePerfisTarifasCache(
      this.cacheManager,
      parsed.unidadeId,
    );

    return mapPerfilTarifaToResponse(created);
  }
}
