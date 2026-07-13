import { Inject, Injectable } from '@nestjs/common';

import type {
  IRecebimentoPainelRepository,
  RecebimentoPainelFiltro,
} from '../../../domain/repositories/recebimento/recebimento-painel.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { getRecebimentoPainelSnapshotDb } from './get-recebimento-painel-snapshot.drizzle.js';

@Injectable()
export class RecebimentoPainelService implements IRecebimentoPainelRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  obterReadModel(filtro: RecebimentoPainelFiltro) {
    return getRecebimentoPainelSnapshotDb(this.db, filtro);
  }
}
