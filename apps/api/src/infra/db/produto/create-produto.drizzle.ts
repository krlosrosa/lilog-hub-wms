import type { CreateProdutoInput } from '../../../domain/model/produto/produto.model.js';
import type { ProdutoRecord } from '../../../domain/repositories/produto/produto.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { produtos } from '../providers/drizzle/config/migrations/schema.js';
import { mapProdutoRow, toProdutoInsertValues } from './map-produto.drizzle.js';

export async function createProdutoDb(
  db: DrizzleClient,
  data: CreateProdutoInput,
): Promise<ProdutoRecord> {
  const [record] = await db
    .insert(produtos)
    .values(toProdutoInsertValues(data))
    .returning();

  if (!record) {
    throw new Error('Failed to create produto');
  }

  return mapProdutoRow(record);
}
