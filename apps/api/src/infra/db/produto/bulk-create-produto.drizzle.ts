import { sql } from 'drizzle-orm';

import type { CreateProdutoInput } from '../../../domain/model/produto/produto.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { produtos } from '../providers/drizzle/config/migrations/schema.js';
import { toProdutoInsertValues } from './map-produto.drizzle.js';

const BATCH_SIZE = 500;

export async function bulkCreateProdutoDb(
  db: DrizzleClient,
  items: CreateProdutoInput[],
): Promise<{ importados: number; duplicados: number }> {
  if (items.length === 0) {
    return { importados: 0, duplicados: 0 };
  }

  let importados = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const values = batch.map(toProdutoInsertValues);

    const result = await db
      .insert(produtos)
      .values(values)
      .onConflictDoNothing({ target: produtos.sku })
      .returning({ id: produtos.id });

    importados += result.length;
  }

  const duplicados = items.length - importados;

  return { importados, duplicados };
}
