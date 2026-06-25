import { Inject, Injectable } from '@nestjs/common';

import type {
  ITorreControleRepository,
  TorreControleFiltro,
} from '../../../../domain/repositories/expedicao/torre-controle.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../providers/drizzle/drizzle.provider.js';
import { obterTorreControleReadModelDb } from './obter-torre-controle-read-model.drizzle.js';

@Injectable()
export class TorreControleService implements ITorreControleRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient) {}

  obterReadModel(filtro: TorreControleFiltro) {
    return obterTorreControleReadModelDb(this.db, filtro);
  }
}
