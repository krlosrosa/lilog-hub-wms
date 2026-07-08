import { desc, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { vwTransportes } from '../providers/drizzle/config/migrations/schema.js';

export async function listTransportesDb(db: DrizzleClient, unidadeId: string) {
  return db
    .select()
    .from(vwTransportes)
    .where(eq(vwTransportes.unidadeId, unidadeId))
    .orderBy(desc(vwTransportes.dataTransporte), desc(vwTransportes.numeroTransporte));
}
