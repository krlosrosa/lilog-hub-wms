import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { divergenciasRecebimento } from '../providers/drizzle/config/migrations/schema.js';

export async function clearDivergenciasDb(
  db: DrizzleClient,
  recebimentoId: string,
): Promise<void> {
  await db
    .delete(divergenciasRecebimento)
    .where(eq(divergenciasRecebimento.recebimentoId, recebimentoId));
}
