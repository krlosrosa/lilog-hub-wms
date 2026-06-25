import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { divergenciasRecebimento } from '../providers/drizzle/config/migrations/schema.js';
import { mapDivergenciaRow } from './map-recebimento.drizzle.js';

export async function findDivergenciasDb(
  db: DrizzleClient,
  recebimentoId: string,
) {
  const rows = await db
    .select()
    .from(divergenciasRecebimento)
    .where(eq(divergenciasRecebimento.recebimentoId, recebimentoId));

  return rows.map(mapDivergenciaRow);
}
