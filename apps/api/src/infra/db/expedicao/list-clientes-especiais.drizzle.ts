import { and, asc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';

import type { ListClientesEspeciaisFilter } from '../../../domain/repositories/expedicao/cliente-especial.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { clientesEspeciais } from '../providers/drizzle/config/migrations/schema.js';
import { mapClienteEspecialRow } from './map-cliente-especial.drizzle.js';

export async function listClientesEspeciaisDb(
  db: DrizzleClient,
  filter: ListClientesEspeciaisFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(clientesEspeciais.unidadeId, filter.unidadeId)];

  if (filter.ativo !== undefined) {
    conditions.push(eq(clientesEspeciais.ativo, filter.ativo));
  }

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(clientesEspeciais.codCliente, term),
        ilike(clientesEspeciais.nomeCliente, term),
      )!,
    );
  }

  const whereClause = and(...conditions);

  const rows = await db
    .select()
    .from(clientesEspeciais)
    .where(whereClause)
    .orderBy(asc(clientesEspeciais.nomeCliente))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clientesEspeciais)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  return {
    items: rows.map(mapClienteEspecialRow),
    total,
    page,
    limit,
  };
}
