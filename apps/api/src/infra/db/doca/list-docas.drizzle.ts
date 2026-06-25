import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';

import type { ListDocasFilter } from '../../../domain/repositories/doca/doca.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { docas } from '../providers/drizzle/config/migrations/schema.js';
import { mapDocaRow } from './map-doca.drizzle.js';

export async function listDocasDb(db: DrizzleClient, filter: ListDocasFilter) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];

  if (filter.unidadeId) {
    conditions.push(eq(docas.unidadeId, filter.unidadeId));
  }

  if (filter.situacao) {
    conditions.push(eq(docas.situacao, filter.situacao));
  }

  if (filter.tipo) {
    conditions.push(eq(docas.tipo, filter.tipo));
  }

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(ilike(docas.codigo, term), ilike(docas.nome, term))!,
    );
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(docas)
    .where(whereClause)
    .orderBy(desc(docas.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(docas)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  return {
    items: rows.map(mapDocaRow),
    total,
    page,
    limit,
  };
}
