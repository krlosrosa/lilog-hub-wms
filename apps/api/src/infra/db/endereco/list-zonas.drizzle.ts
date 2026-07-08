import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  enderecos,
  unidades,
} from '../providers/drizzle/config/migrations/schema.js';

export async function listDistinctZonasDb(
  db: DrizzleClient,
  unidadeId?: string,
) {
  const conditions = unidadeId ? [eq(enderecos.unidadeId, unidadeId)] : [];

  const rows = await db
    .selectDistinct({ zona: enderecos.zona })
    .from(enderecos)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(enderecos.zona);

  return rows.map((row) => row.zona);
}

export async function unidadeExistsDb(db: DrizzleClient, unidadeId: string) {
  const rows = await db
    .select({ id: unidades.id })
    .from(unidades)
    .where(eq(unidades.id, unidadeId))
    .limit(1);

  return rows.length > 0;
}
