import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { itensRecebimento } from '../providers/drizzle/config/migrations/schema.js';

export type RemoveItensConferenciaProdutoResult = {
  produtoId: string;
  removedCount: number;
};

export async function removeItensConferenciaProdutoDb(
  db: DrizzleClient,
  recebimentoId: string,
  produtoId: string,
): Promise<RemoveItensConferenciaProdutoResult> {
  const removed = await db
    .delete(itensRecebimento)
    .where(
      and(
        eq(itensRecebimento.recebimentoId, recebimentoId),
        eq(itensRecebimento.produtoId, produtoId),
      ),
    )
    .returning({ id: itensRecebimento.id });

  return {
    produtoId,
    removedCount: removed.length,
  };
}
