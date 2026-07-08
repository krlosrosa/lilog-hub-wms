import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateRegraProcessoInput,
  GatilhoRegra,
  UpdateRegraProcessoInput,
} from '../../../domain/model/regra-processo/regra-processo.model.js';
import type {
  IRegraProcessoRepository,
  ListRegrasProcessoFilter,
  RegraProcessoRecord,
} from '../../../domain/repositories/regra-processo/regra-processo.repository.js';
import {
  createRegraProcessoDb,
  deleteRegraProcessoDb,
  findRegraProcessoByIdDb,
  findRegraProcessoByNomeDb,
  listRegrasAtivasPorGatilhoDb,
  listRegrasProcessoDb,
  updateRegraProcessoDb,
} from './regra-processo.drizzle.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';

@Injectable()
export class RegraProcessoService implements IRegraProcessoRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  create(input: CreateRegraProcessoInput): Promise<RegraProcessoRecord> {
    return createRegraProcessoDb(this.db, input);
  }

  list(filter: ListRegrasProcessoFilter) {
    return listRegrasProcessoDb(this.db, filter);
  }

  findById(id: string): Promise<RegraProcessoRecord | null> {
    return findRegraProcessoByIdDb(this.db, id);
  }

  findByNome(
    unidadeId: string,
    gatilho: GatilhoRegra,
    nome: string,
  ): Promise<RegraProcessoRecord | null> {
    return findRegraProcessoByNomeDb(this.db, unidadeId, gatilho, nome);
  }

  update(
    id: string,
    input: UpdateRegraProcessoInput,
  ): Promise<RegraProcessoRecord | null> {
    return updateRegraProcessoDb(this.db, id, input);
  }

  delete(id: string): Promise<void> {
    return deleteRegraProcessoDb(this.db, id);
  }

  listarAtivasPorGatilho(
    unidadeId: string,
    gatilho: GatilhoRegra,
  ): Promise<RegraProcessoRecord[]> {
    return listRegrasAtivasPorGatilhoDb(this.db, unidadeId, gatilho);
  }
}
