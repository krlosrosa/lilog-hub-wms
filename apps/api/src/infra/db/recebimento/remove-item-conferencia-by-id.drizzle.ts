import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { itensRecebimento } from '../providers/drizzle/config/migrations/schema.js';

export type RemoveItemConferenciaByIdResult = {
  itemId: string;
  removed: boolean;
  produtoId?: string;
};

export async function removeItemConferenciaByIdDb(
  db: DrizzleClient,
  recebimentoId: string,
  itemId: string,
): Promise<RemoveItemConferenciaByIdResult> {
  const removed = await db
    .delete(itensRecebimento)
    .where(
      and(
        eq(itensRecebimento.id, itemId),
        eq(itensRecebimento.recebimentoId, recebimentoId),
      ),
    )
    .returning({
      id: itensRecebimento.id,
      produtoId: itensRecebimento.produtoId,
    });

  if (removed.length === 0) {
    return { itemId, removed: false };
  }

  return {
    itemId,
    removed: true,
    produtoId: removed[0]!.produtoId,
  };
}
