import {
  and,
  desc,
  eq,
  ilike,
  isNull,
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import type { ListProdutosFilter } from '../../../domain/repositories/produto/produto.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { produtos } from '../providers/drizzle/config/migrations/schema.js';
import { mapProdutoRow } from './map-produto.drizzle.js';

export async function listProdutosDb(
  db: DrizzleClient,
  filter: ListProdutosFilter
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];

  if (filter.categoria) {
    conditions.push(eq(produtos.categoria, filter.categoria));
  }

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(produtos.sku, term),
        ilike(produtos.descricao, term),
        ilike(produtos.produtoId, term),
        ilike(produtos.ean, term),
        ilike(produtos.grupo, term),
        ilike(produtos.empresa, term)
      )!
    );
  }

  if (filter.empresa) {
    conditions.push(eq(produtos.empresa, filter.empresa));
  }

  if (filter.tipo) {
    conditions.push(eq(produtos.tipo, filter.tipo));
  }

  if (filter.ean === 'sem') {
    conditions.push(or(isNull(produtos.ean), eq(produtos.ean, ''))!);
  }

  if (filter.ean === 'com') {
    conditions.push(
      and(ne(produtos.ean, ''), sql`${produtos.ean} IS NOT NULL`)!
    );
  }

  if (filter.dum === 'sem') {
    conditions.push(or(isNull(produtos.dum), eq(produtos.dum, ''))!);
  }

  if (filter.dum === 'com') {
    conditions.push(
      and(ne(produtos.dum, ''), sql`${produtos.dum} IS NOT NULL`)!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(produtos)
    .where(whereClause)
    .orderBy(desc(produtos.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(produtos)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  return {
    items: rows.map(mapProdutoRow),
    total,
    page,
    limit,
  };
}
