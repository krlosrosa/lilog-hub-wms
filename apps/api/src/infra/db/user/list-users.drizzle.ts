import { and, count, eq, ilike, isNull, or, sql } from 'drizzle-orm';

import type {
  ListUsersFilter,
  ListUsersResult,
} from '../../../domain/repositories/user/user.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  funcionarios,
  users,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapUserRow } from './map-user.drizzle.js';

function buildWhere(filter: ListUsersFilter) {
  const conditions = [];

  if (filter.status) {
    conditions.push(eq(users.status, filter.status));
  }

  if (filter.funcionarioId) {
    conditions.push(eq(users.funcionarioId, filter.funcionarioId));
  }

  if (filter.unidadeId) {
    conditions.push(
      or(
        eq(funcionarios.unidadeId, filter.unidadeId),
        isNull(users.funcionarioId),
      ),
    );
  }

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(ilike(users.name, term), ilike(users.email, term), ilike(users.role, term)),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function listUsersDb(
  db: DrizzleClient,
  filter: ListUsersFilter,
): Promise<ListUsersResult> {
  const where = buildWhere(filter);
  const offset = (filter.page - 1) * filter.limit;

  if (filter.unidadeId) {
    const [totalRow] = await db
      .select({ total: count() })
      .from(users)
      .leftJoin(funcionarios, eq(users.funcionarioId, funcionarios.id))
      .where(where);

    const rows = await db
      .select({ user: users })
      .from(users)
      .leftJoin(funcionarios, eq(users.funcionarioId, funcionarios.id))
      .where(where)
      .orderBy(sql`${users.name} asc`)
      .limit(filter.limit)
      .offset(offset);

    return {
      items: rows.map((row) => mapUserRow(row.user)),
      total: Number(totalRow?.total ?? 0),
      page: filter.page,
      limit: filter.limit,
    };
  }

  const [totalRow] = await db
    .select({ total: count() })
    .from(users)
    .where(where);

  const rows = await db
    .select()
    .from(users)
    .where(where)
    .orderBy(sql`${users.name} asc`)
    .limit(filter.limit)
    .offset(offset);

  return {
    items: rows.map((row) => mapUserRow(row)),
    total: Number(totalRow?.total ?? 0),
    page: filter.page,
    limit: filter.limit,
  };
}
