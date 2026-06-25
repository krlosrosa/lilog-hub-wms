import { and, asc, count, eq } from 'drizzle-orm';

import type {
  ListEquipesFilter,
  ListEquipesResult,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { equipes } from '../providers/drizzle/config/migrations/schema.js';

export async function listEquipesDb(
  db: DrizzleClient,
  filter: ListEquipesFilter,
): Promise<ListEquipesResult> {
  const conditions = [eq(equipes.unidadeId, filter.unidadeId)];

  if (filter.ativo !== undefined) {
    conditions.push(eq(equipes.ativo, filter.ativo));
  }

  const where = and(...conditions);
  const offset = (filter.page - 1) * filter.limit;

  const [totalRow] = await db
    .select({ total: count() })
    .from(equipes)
    .where(where);

  const rows = await db
    .select({
      id: equipes.id,
      unidadeId: equipes.unidadeId,
      nome: equipes.nome,
      area: equipes.area,
      ativo: equipes.ativo,
      createdAt: equipes.createdAt,
      updatedAt: equipes.updatedAt,
    })
    .from(equipes)
    .where(where)
    .orderBy(asc(equipes.nome))
    .limit(filter.limit)
    .offset(offset);

  return {
    items: rows,
    total: Number(totalRow?.total ?? 0),
    page: filter.page,
    limit: filter.limit,
  };
}
