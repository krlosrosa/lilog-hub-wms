import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateRecebimentoAvariaInput,
  IRecebimentoAvariaRepository,
} from '../../../domain/repositories/recebimento/recebimento-avaria.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { createRecebimentoAvariasDb } from './create-recebimento-avarias.drizzle.js';
import { listRecebimentoAvariasDb } from './list-recebimento-avarias.drizzle.js';

@Injectable()
export class RecebimentoAvariaService implements IRecebimentoAvariaRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  createMany(items: CreateRecebimentoAvariaInput[]) {
    return createRecebimentoAvariasDb(this.db, items);
  }

  listByRecebimento(recebimentoId: string) {
    return listRecebimentoAvariasDb(this.db, recebimentoId);
  }
}
