import { Inject, Injectable } from '@nestjs/common';

import type {
  IPessoaRepository,
  ListPessoasFilter,
} from '../../../domain/repositories/pessoa/pessoa.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { listPessoasDb } from './list-pessoas.drizzle.js';

@Injectable()
export class PessoaService implements IPessoaRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  list(filter: ListPessoasFilter) {
    return listPessoasDb(this.db, filter);
  }
}
