import { eq } from 'drizzle-orm';

import type { ProdutoRecord } from '../../../domain/repositories/produto/produto.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { produtos } from '../providers/drizzle/config/migrations/schema.js';
import { mapProdutoRow } from './map-produto.drizzle.js';

export async function findProdutoByIdDb(
  db: DrizzleClient,
  id: string,
): Promise<ProdutoRecord | null> {
  const [row] = await db
    .select()
    .from(produtos)
    .where(eq(produtos.id, id))
    .limit(1);

  return row ? mapProdutoRow(row) : null;
}

export async function findProdutoBySkuDb(
  db: DrizzleClient,
  sku: string,
): Promise<ProdutoRecord | null> {
  const [row] = await db
    .select()
    .from(produtos)
    .where(eq(produtos.sku, sku.trim()))
    .limit(1);

  return row ? mapProdutoRow(row) : null;
}

export async function findProdutoByProdutoIdDb(
  db: DrizzleClient,
  produtoId: string,
): Promise<ProdutoRecord | null> {
  const [row] = await db
    .select()
    .from(produtos)
    .where(eq(produtos.produtoId, produtoId.trim()))
    .limit(1);

  return row ? mapProdutoRow(row) : null;
}
