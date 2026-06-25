import { and, desc, eq, sql, type SQL } from 'drizzle-orm';

import type { ListCncsFilter } from '../../../domain/repositories/cnc/cnc.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { naoConformidades } from '../providers/drizzle/config/migrations/schema.js';
import { mapCncRow } from './map-cnc.drizzle.js';

export async function listCncsDb(db: DrizzleClient, filter: ListCncsFilter) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [eq(naoConformidades.unidadeId, filter.unidadeId)];

  if (filter.situacao) {
    conditions.push(eq(naoConformidades.situacao, filter.situacao));
  }

  if (filter.origemId) {
    conditions.push(eq(naoConformidades.origemId, filter.origemId));
  }

  const whereClause = and(...conditions);

  const rows = await db
    .select()
    .from(naoConformidades)
    .where(whereClause)
    .orderBy(desc(naoConformidades.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(naoConformidades)
    .where(whereClause);

  return {
    items: rows.map(mapCncRow),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  };
}
