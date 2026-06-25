import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateProdutoInput,
  UpdateProdutoInput,
} from '../../../domain/model/produto/produto.model.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
  type ListProdutosFilter,
} from '../../../domain/repositories/produto/produto.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { bulkCreateProdutoDb } from './bulk-create-produto.drizzle.js';
import { createProdutoDb } from './create-produto.drizzle.js';
import { deleteProdutoDb } from './delete-produto.drizzle.js';
import {
  findProdutoByIdDb,
  findProdutoByProdutoIdDb,
  findProdutoBySkuDb,
} from './find-produto.drizzle.js';
import { findProdutosByCodigosRemessaDb } from './find-produtos-by-codigos-remessa.drizzle.js';
import { listProdutosDb } from './list-produtos.drizzle.js';
import { updateProdutoDb } from './update-produto.drizzle.js';

@Injectable()
export class ProdutoService implements IProdutoRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  list(filter: ListProdutosFilter) {
    return listProdutosDb(this.db, filter);
  }

  findById(id: string) {
    return findProdutoByIdDb(this.db, id);
  }

  findBySku(sku: string) {
    return findProdutoBySkuDb(this.db, sku);
  }

  findByProdutoId(produtoId: string) {
    return findProdutoByProdutoIdDb(this.db, produtoId);
  }

  findByCodigosRemessa(codigos: string[]) {
    return findProdutosByCodigosRemessaDb(this.db, codigos);
  }

  create(data: CreateProdutoInput) {
    return createProdutoDb(this.db, data);
  }

  bulkCreate(items: CreateProdutoInput[]) {
    return bulkCreateProdutoDb(this.db, items);
  }

  update(id: string, data: UpdateProdutoInput) {
    return updateProdutoDb(this.db, id, data);
  }

  delete(id: string) {
    return deleteProdutoDb(this.db, id);
  }
}
