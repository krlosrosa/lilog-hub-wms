import { and, asc, eq, type SQL } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { centros, unidades } from '../providers/drizzle/config/migrations/schema.js';
import { mapCentroRow } from './map-unidade.drizzle.js';

export async function listCentrosDb(
  db: DrizzleClient,
  unidadeId?: string,
) {
  const conditions: SQL[] = [];

  if (unidadeId) {
    conditions.push(eq(centros.unidadeId, unidadeId));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      centro: centros,
      unidadeNome: unidades.nome,
      unidadeFilial: unidades.nomeFilial,
    })
    .from(centros)
    .innerJoin(unidades, eq(centros.unidadeId, unidades.id))
    .where(whereClause)
    .orderBy(asc(centros.centro));

  return rows.map(({ centro, unidadeNome, unidadeFilial }) => ({
    ...mapCentroRow(centro),
    unidadeNome,
    unidadeFilial,
  }));
}
