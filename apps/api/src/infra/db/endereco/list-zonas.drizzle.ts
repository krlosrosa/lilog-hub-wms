import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  centros,
  enderecos,
} from '../providers/drizzle/config/migrations/schema.js';

export async function listDistinctZonasDb(
  db: DrizzleClient,
  centroId?: string,
) {
  const conditions = centroId ? [eq(enderecos.centroId, centroId)] : [];

  const rows = await db
    .selectDistinct({ zona: enderecos.zona })
    .from(enderecos)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(enderecos.zona);

  return rows.map((row) => row.zona);
}

export async function centroExistsDb(db: DrizzleClient, centroId: string) {
  const rows = await db
    .select({ id: centros.id })
    .from(centros)
    .where(eq(centros.id, centroId))
    .limit(1);

  return rows.length > 0;
}
