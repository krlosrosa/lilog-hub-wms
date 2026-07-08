import { and, count, eq, ilike, or, sql } from 'drizzle-orm';

import type {
  ListUsuariosTerceirosFilter,
  ListUsuariosTerceirosResult,
} from '../../../domain/repositories/usuario-terceiro/usuario-terceiro.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { usuariosTerceiros } from '../providers/drizzle/config/migrations/schema.js';
import { mapUsuarioTerceiroRow } from './map-usuario-terceiro.drizzle.js';

function buildWhere(filter: ListUsuariosTerceirosFilter) {
  const conditions = [];

  if (filter.status) {
    conditions.push(eq(usuariosTerceiros.status, filter.status));
  }

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(usuariosTerceiros.nome, term),
        ilike(usuariosTerceiros.email, term),
        ilike(usuariosTerceiros.role, term),
      ),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function listUsuariosTerceirosDb(
  db: DrizzleClient,
  filter: ListUsuariosTerceirosFilter,
): Promise<ListUsuariosTerceirosResult> {
  const where = buildWhere(filter);
  const offset = (filter.page - 1) * filter.limit;

  const [totalRow] = await db
    .select({ total: count() })
    .from(usuariosTerceiros)
    .where(where);

  const rows = await db
    .select()
    .from(usuariosTerceiros)
    .where(where)
    .orderBy(sql`${usuariosTerceiros.nome} asc`)
    .limit(filter.limit)
    .offset(offset);

  return {
    items: rows.map((row) => mapUsuarioTerceiroRow(row)),
    total: Number(totalRow?.total ?? 0),
    page: filter.page,
    limit: filter.limit,
  };
}
