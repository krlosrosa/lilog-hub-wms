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
  findProdutoByProdutoIdDb,
  findProdutoBySkuDb,
  resolveProdutoPorCodigoDb,
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

  findByProdutoId(produtoId: string) {
    return findProdutoByProdutoIdDb(this.db, produtoId);
  }

  findBySku(sku: string) {
    return findProdutoBySkuDb(this.db, sku);
  }

  resolvePorCodigo(codigo: string) {
    return resolveProdutoPorCodigoDb(this.db, codigo);
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

  update(produtoId: string, data: UpdateProdutoInput) {
    return updateProdutoDb(this.db, produtoId, data);
  }

  delete(produtoId: string) {
    return deleteProdutoDb(this.db, produtoId);
  }
}

export { PRODUTO_REPOSITORY };
