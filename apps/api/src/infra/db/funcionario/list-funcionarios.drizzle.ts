import { and, count, eq, ilike, or, sql } from 'drizzle-orm';

import type {
  ListFuncionariosFilter,
  ListFuncionariosResult,
} from '../../../domain/repositories/funcionario/funcionario.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { funcionarios } from '../providers/drizzle/config/migrations/schema.js';
import { mapFuncionarioRow } from './map-funcionario.drizzle.js';

function buildWhere(filter: ListFuncionariosFilter) {
  const conditions = [];

  if (filter.unidadeId) {
    conditions.push(eq(funcionarios.unidadeId, filter.unidadeId));
  }

  if (filter.cargo) {
    conditions.push(eq(funcionarios.cargo, filter.cargo));
  }

  if (filter.situacao) {
    conditions.push(eq(funcionarios.situacao, filter.situacao));
  }

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(funcionarios.nome, term),
        ilike(funcionarios.matricula, term),
      ),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function listFuncionariosDb(
  db: DrizzleClient,
  filter: ListFuncionariosFilter,
): Promise<ListFuncionariosResult> {
  const where = buildWhere(filter);
  const offset = (filter.page - 1) * filter.limit;

  const [totalRow] = await db
    .select({ total: count() })
    .from(funcionarios)
    .where(where);

  const rows = await db
    .select()
    .from(funcionarios)
    .where(where)
    .orderBy(sql`${funcionarios.nome} asc`)
    .limit(filter.limit)
    .offset(offset);

  return {
    items: rows.map(mapFuncionarioRow),
    total: Number(totalRow?.total ?? 0),
    page: filter.page,
    limit: filter.limit,
  };
}
