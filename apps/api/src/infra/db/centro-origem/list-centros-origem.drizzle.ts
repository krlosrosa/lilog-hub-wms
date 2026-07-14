import { and, asc, ilike, or, sql, type SQL } from 'drizzle-orm';

import type { ListCentrosOrigemFilter } from '../../../domain/repositories/centro-origem/centro-origem.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { centrosOrigem } from '../providers/drizzle/config/migrations/schema.js';
import { mapCentroOrigemRow } from './map-centro-origem.drizzle.js';

export async function listCentrosOrigemDb(
  db: DrizzleClient,
  filter: ListCentrosOrigemFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(ilike(centrosOrigem.centro, term), ilike(centrosOrigem.nome, term))!,
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(centrosOrigem)
    .where(whereClause)
    .orderBy(asc(centrosOrigem.centro))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(centrosOrigem)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  return {
    items: rows.map(mapCentroOrigemRow),
    total,
    page,
    limit,
  };
}
