import { Inject, Injectable } from '@nestjs/common';

import type { CreateRegraEnderecamentoInput } from '../../../domain/model/armazenagem/regra-enderecamento.model.js';
import type { UpdateRegraEnderecamentoInput } from '../../../domain/model/armazenagem/regra-enderecamento.model.js';
import type {
  IRegraEnderecamentoRepository,
  ListRegrasEnderecamentoFilter,
  FindEnderecoDisponivelPorRegraInput,
} from '../../../domain/repositories/armazenagem/regra-enderecamento.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';

import {
  createRegraEnderecamentoDb,
  deleteRegraEnderecamentoDb,
  findRegraEnderecamentoByIdDb,
  listRegrasAtivasByUnidadeDb,
  listRegrasEnderecamentoDb,
  updateRegraEnderecamentoDb,
} from './regra-enderecamento.drizzle.js';
import { findEnderecoDisponivelPorRegraDb } from './find-endereco-disponivel-por-regra.drizzle.js';

@Injectable()
export class RegraEnderecamentoService implements IRegraEnderecamentoRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient) {}

  create(input: CreateRegraEnderecamentoInput) {
    return createRegraEnderecamentoDb(this.db, input);
  }

  list(filter: ListRegrasEnderecamentoFilter) {
    return listRegrasEnderecamentoDb(this.db, filter);
  }

  findById(id: string) {
    return findRegraEnderecamentoByIdDb(this.db, id);
  }

  listAtivasByUnidade(unidadeId: string) {
    return listRegrasAtivasByUnidadeDb(this.db, unidadeId);
  }

  update(id: string, input: UpdateRegraEnderecamentoInput) {
    return updateRegraEnderecamentoDb(this.db, id, input);
  }

  delete(id: string) {
    return deleteRegraEnderecamentoDb(this.db, id);
  }

  findEnderecoDisponivelPorRegra(input: FindEnderecoDisponivelPorRegraInput) {
    return findEnderecoDisponivelPorRegraDb(this.db, input);
  }
}
