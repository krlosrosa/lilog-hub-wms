import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';

import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
  type IConfiguracaoOperacionalRepository,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import { mapConfiguracaoOperacionalToResponse } from '../../dtos/configuracao-operacional/map-configuracao-operacional-response.js';

const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class ObterConfiguracaoOperacionalUseCase {
  constructor(
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(id: string) {
    const cacheKey = `config-operacional:${id}`;
    const cached = await this.cacheManager.get<Awaited<
      ReturnType<typeof mapConfiguracaoOperacionalToResponse>
    >>(cacheKey);

    if (cached) {
      return cached;
    }

    const record = await this.configuracaoOperacionalRepository.findById(id);

    if (!record) {
      throw new NotFoundException(`Configuração "${id}" não encontrada`);
    }

    const response = mapConfiguracaoOperacionalToResponse(record);
    await this.cacheManager.set(cacheKey, response, CACHE_TTL_MS);

    return response;
  }
}
