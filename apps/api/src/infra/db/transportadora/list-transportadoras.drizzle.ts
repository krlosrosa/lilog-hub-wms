import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';

import type { ListTransportadorasFilter } from '../../../domain/repositories/transportadora/transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportadoras } from '../providers/drizzle/config/migrations/schema.js';
import { mapTransportadoraRow } from './map-transportadora.drizzle.js';

export async function listTransportadorasDb(
  db: DrizzleClient,
  filter: ListTransportadorasFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];

  if (filter.unidadeId) {
    conditions.push(eq(transportadoras.unidadeId, filter.unidadeId));
  }

  if (filter.status) {
    conditions.push(eq(transportadoras.status, filter.status));
  }

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    const searchDigits = filter.search.replace(/\D/g, '');

    const searchConditions = [
      ilike(transportadoras.nome, term),
      sql`cast(${transportadoras.idRavexTransportadora} as text) like ${term}`,
    ];

    if (searchDigits) {
      searchConditions.push(ilike(transportadoras.cnpj, `%${searchDigits}%`));
    }

    conditions.push(or(...searchConditions)!);
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(transportadoras)
    .where(whereClause)
    .orderBy(desc(transportadoras.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transportadoras)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  return {
    items: rows.map(mapTransportadoraRow),
    total,
    page,
    limit,
  };
}
