import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { itensRecebimento } from '../providers/drizzle/config/migrations/schema.js';
import { mapItemRecebimentoRow } from './map-recebimento.drizzle.js';

export async function findItensRecebimentoDb(
  db: DrizzleClient,
  recebimentoId: string,
) {
  const rows = await db
    .select()
    .from(itensRecebimento)
    .where(eq(itensRecebimento.recebimentoId, recebimentoId));

  return rows.map(mapItemRecebimentoRow);
}
