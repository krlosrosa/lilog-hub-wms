import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateProdutoEnderecoData,
  UpdateProdutoEnderecoData,
} from '../../../domain/model/produto-endereco/produto-endereco.model.js';
import {
  PRODUTO_ENDERECO_REPOSITORY,
  type IProdutoEnderecoRepository,
  type ListProdutoEnderecosFilter,
} from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { createProdutoEnderecoDb } from './create-produto-endereco.drizzle.js';
import { deleteProdutoEnderecoDb } from './delete-produto-endereco.drizzle.js';
import { findProdutoEnderecoByIdDb } from './find-produto-endereco.drizzle.js';
import { listProdutoEnderecosDb } from './list-produto-enderecos.drizzle.js';
import { updateProdutoEnderecoDb } from './update-produto-endereco.drizzle.js';

@Injectable()
export class ProdutoEnderecoService implements IProdutoEnderecoRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  list(filter: ListProdutoEnderecosFilter) {
    return listProdutoEnderecosDb(this.db, filter);
  }

  findById(id: string) {
    return findProdutoEnderecoByIdDb(this.db, id);
  }

  create(data: CreateProdutoEnderecoData) {
    return createProdutoEnderecoDb(this.db, data);
  }

  update(id: string, data: UpdateProdutoEnderecoData) {
    return updateProdutoEnderecoDb(this.db, id, data);
  }

  delete(id: string) {
    return deleteProdutoEnderecoDb(this.db, id);
  }
}
