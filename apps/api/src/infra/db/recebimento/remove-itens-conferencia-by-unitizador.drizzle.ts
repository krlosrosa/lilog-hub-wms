import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { itensRecebimento } from '../providers/drizzle/config/migrations/schema.js';

export type RemoveItensConferenciaByUnitizadorResult = {
  unitizadorId: string;
  removedCount: number;
};

export async function removeItensConferenciaByUnitizadorDb(
  db: DrizzleClient,
  recebimentoId: string,
  unitizadorId: string,
  produtoId?: string,
): Promise<RemoveItensConferenciaByUnitizadorResult> {
  const conditions = [
    eq(itensRecebimento.recebimentoId, recebimentoId),
    eq(itensRecebimento.unitizadorId, unitizadorId),
  ];

  if (produtoId) {
    conditions.push(eq(itensRecebimento.produtoId, produtoId));
  }

  const removed = await db
    .delete(itensRecebimento)
    .where(and(...conditions))
    .returning({ id: itensRecebimento.id });

  return {
    unitizadorId,
    removedCount: removed.length,
  };
}
