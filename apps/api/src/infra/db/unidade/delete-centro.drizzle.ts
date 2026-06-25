import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { centros } from '../providers/drizzle/config/migrations/schema.js';

export async function deleteCentroDb(
  db: DrizzleClient,
  centroId: string,
  unidadeId: string,
) {
  await db
    .delete(centros)
    .where(and(eq(centros.id, centroId), eq(centros.unidadeId, unidadeId)));
}
