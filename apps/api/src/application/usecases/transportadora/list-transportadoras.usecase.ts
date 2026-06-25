import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

import type { ListTransportadorasFilter } from '../../../domain/repositories/transportadora/transportadora.repository.js';
import {
  TRANSPORTADORA_REPOSITORY,
  type ITransportadoraRepository,
} from '../../../domain/repositories/transportadora/transportadora.repository.js';

const CACHE_TTL_MS = 2 * 60 * 1000;

@Injectable()
export class ListTransportadorasUseCase {
  constructor(
    @Inject(TRANSPORTADORA_REPOSITORY)
    private readonly transportadoraRepository: ITransportadoraRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(filter: ListTransportadorasFilter) {
    const cacheKey = `transportadoras:${JSON.stringify(filter)}`;
    const cached = await this.cacheManager.get<
      Awaited<ReturnType<ITransportadoraRepository['list']>>
    >(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await this.transportadoraRepository.list(filter);
    await this.cacheManager.set(cacheKey, result, CACHE_TTL_MS);

    return result;
  }
}
