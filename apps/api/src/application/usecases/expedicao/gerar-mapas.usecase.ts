import { Inject, Injectable } from '@nestjs/common';

import type {
  GerarMapasBodyInput,
  GerarMapasResponse,
} from '../../dtos/expedicao/gerar-mapas.dto.js';
import { montarMapasDeTransportes } from '../../services/expedicao/montar-mapas-de-transportes.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';

@Injectable()
export class GerarMapasUseCase {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  async execute(input: GerarMapasBodyInput): Promise<GerarMapasResponse> {
    const { payload } = await montarMapasDeTransportes(this.db, input);
    return payload;
  }
}
