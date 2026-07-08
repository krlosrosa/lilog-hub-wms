import { and, desc, eq, inArray } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { vwTransportes } from '../providers/drizzle/config/migrations/schema.js';

export async function listTransportesByIdsDb(
  db: DrizzleClient,
  unidadeId: string,
  transporteIds: string[],
) {
  if (transporteIds.length === 0) {
    return [];
  }

  return db
    .select()
    .from(vwTransportes)
    .where(
      and(
        eq(vwTransportes.unidadeId, unidadeId),
        inArray(vwTransportes.numeroTransporte, transporteIds),
      ),
    )
    .orderBy(desc(vwTransportes.dataTransporte), desc(vwTransportes.numeroTransporte));
}
