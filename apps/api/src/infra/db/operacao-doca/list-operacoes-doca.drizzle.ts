import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';

import type { ListOperacoesDocaFilter } from '../../../domain/repositories/operacao-doca/operacao-doca.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { operacoesDoca } from '../providers/drizzle/config/migrations/schema.js';
import { mapOperacaoDocaRow } from './map-operacao-doca.drizzle.js';

export async function listOperacoesDocaDb(
  db: DrizzleClient,
  filter: ListOperacoesDocaFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];

  if (filter.docaId) {
    conditions.push(eq(operacoesDoca.docaId, filter.docaId));
  }

  if (filter.situacao) {
    conditions.push(eq(operacoesDoca.situacao, filter.situacao));
  }

  if (filter.dataPrevistaFrom) {
    conditions.push(gte(operacoesDoca.dataPrevista, filter.dataPrevistaFrom));
  }

  if (filter.dataPrevistaTo) {
    conditions.push(lte(operacoesDoca.dataPrevista, filter.dataPrevistaTo));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(operacoesDoca)
    .where(whereClause)
    .orderBy(desc(operacoesDoca.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(operacoesDoca)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  return {
    items: rows.map(mapOperacaoDocaRow),
    total,
    page,
    limit,
  };
}
