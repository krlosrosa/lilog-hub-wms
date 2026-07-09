import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { recebimentoAvarias } from '../providers/drizzle/config/migrations/schema.js';

export async function deleteRecebimentoAvariasDb(
  db: DrizzleClient,
  recebimentoId: string,
): Promise<{ removedCount: number }> {
  const removed = await db
    .delete(recebimentoAvarias)
    .where(eq(recebimentoAvarias.recebimentoId, recebimentoId))
    .returning({ id: recebimentoAvarias.id });

  return { removedCount: removed.length };
}
