import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { recebimentoAvarias } from '../providers/drizzle/config/migrations/schema.js';

export async function deleteRecebimentoAvariaDb(
  db: DrizzleClient,
  recebimentoId: string,
  avariaId: string,
): Promise<{ removed: boolean }> {
  const removed = await db
    .delete(recebimentoAvarias)
    .where(
      and(
        eq(recebimentoAvarias.id, avariaId),
        eq(recebimentoAvarias.recebimentoId, recebimentoId),
      ),
    )
    .returning({ id: recebimentoAvarias.id });

  return { removed: removed.length > 0 };
}
