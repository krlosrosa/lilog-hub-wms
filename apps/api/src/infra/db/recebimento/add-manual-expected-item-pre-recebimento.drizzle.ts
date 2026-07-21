import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { itensPreRecebimento } from '../providers/drizzle/config/migrations/schema.js';

export async function addManualExpectedItemPreRecebimentoDb(
  db: DrizzleClient,
  preRecebimentoId: string,
  produtoId: string,
): Promise<void> {
  const [existing] = await db
    .select({ id: itensPreRecebimento.id })
    .from(itensPreRecebimento)
    .where(
      and(
        eq(itensPreRecebimento.preRecebimentoId, preRecebimentoId),
        eq(itensPreRecebimento.produtoId, produtoId),
      ),
    )
    .limit(1);

  if (existing) {
    return;
  }

  await db.insert(itensPreRecebimento).values({
    preRecebimentoId,
    produtoId,
    quantidadeEsperada: '0',
    unidadeMedida: 'UN',
    loteEsperado: null,
    pesoEsperado: null,
    validadeEsperada: null,
  });
}
