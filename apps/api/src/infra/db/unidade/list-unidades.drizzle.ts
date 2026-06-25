import { and, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';

import type { ListUnidadesFilter } from '../../../domain/repositories/unidade/unidade.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  centros,
  unidades,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  groupCentrosByUnidadeId,
  mapCentroRow,
  mapUnidadeRow,
} from './map-unidade.drizzle.js';

export async function listUnidadesDb(
  db: DrizzleClient,
  filter: ListUnidadesFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];

  if (filter.cluster) {
    conditions.push(eq(unidades.cluster, filter.cluster));
  }

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(unidades.id, term),
        ilike(unidades.nome, term),
        ilike(unidades.nomeFilial, term),
      )!,
    );
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const unidadeRows = await db
    .select()
    .from(unidades)
    .where(whereClause)
    .orderBy(desc(unidades.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(unidades)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;
  const unidadeIds = unidadeRows.map((row) => row.id);

  const centrosRows =
    unidadeIds.length > 0
      ? await db
          .select()
          .from(centros)
          .where(inArray(centros.unidadeId, unidadeIds))
          .orderBy(centros.centro)
      : [];

  const centrosByUnidade = groupCentrosByUnidadeId(
    centrosRows.map(mapCentroRow),
  );

  return {
    items: unidadeRows.map((row) => {
      const mapped = mapUnidadeRow(row);
      return {
        ...mapped,
        centros: centrosByUnidade.get(mapped.id) ?? [],
      };
    }),
    total,
    page,
    limit,
  };
}
