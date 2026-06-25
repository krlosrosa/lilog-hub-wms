import { asc, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  centros,
  unidades,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapCentroRow, mapUnidadeRow } from './map-unidade.drizzle.js';

export async function findUnidadeDb(db: DrizzleClient, id: string) {
  const [unidadeRow] = await db
    .select()
    .from(unidades)
    .where(eq(unidades.id, id))
    .limit(1);

  if (!unidadeRow) {
    return null;
  }

  const centrosRows = await db
    .select()
    .from(centros)
    .where(eq(centros.unidadeId, id))
    .orderBy(asc(centros.centro));

  return {
    ...mapUnidadeRow(unidadeRow),
    centros: centrosRows.map(mapCentroRow),
  };
}
