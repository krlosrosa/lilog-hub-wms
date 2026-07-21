import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { itensPreRecebimento } from '../providers/drizzle/config/migrations/schema.js';

export async function removeManualExpectedItemPreRecebimentoDb(
  db: DrizzleClient,
  preRecebimentoId: string,
  produtoId: string,
): Promise<boolean> {
  const result = await db
    .delete(itensPreRecebimento)
    .where(
      and(
        eq(itensPreRecebimento.preRecebimentoId, preRecebimentoId),
        eq(itensPreRecebimento.produtoId, produtoId),
        eq(itensPreRecebimento.quantidadeEsperada, '0'),
      ),
    )
    .returning({ id: itensPreRecebimento.id });

  return result.length > 0;
}
