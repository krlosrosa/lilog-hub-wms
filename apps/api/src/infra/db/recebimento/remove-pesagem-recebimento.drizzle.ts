import { and, count, eq, sum } from 'drizzle-orm';

import type {
  RemovePesagemRecebimentoResult,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  itensRecebimento,
  pesagensRecebimento,
} from '../providers/drizzle/config/migrations/schema.js';

export async function removePesagemRecebimentoDb(
  db: DrizzleClient,
  recebimentoId: string,
  pesagemId: string,
): Promise<RemovePesagemRecebimentoResult> {
  const [pesagemRow] = await db
    .select({
      pesagem: pesagensRecebimento,
      item: itensRecebimento,
    })
    .from(pesagensRecebimento)
    .innerJoin(
      itensRecebimento,
      eq(pesagensRecebimento.recebimentoItemId, itensRecebimento.id),
    )
    .where(
      and(
        eq(pesagensRecebimento.id, pesagemId),
        eq(itensRecebimento.recebimentoId, recebimentoId),
      ),
    )
    .limit(1);

  if (!pesagemRow) {
    return { pesagemId, removed: false };
  }

  const recebimentoItemId = pesagemRow.pesagem.recebimentoItemId;
  const produtoId = pesagemRow.item.produtoId;

  await db
    .delete(pesagensRecebimento)
    .where(eq(pesagensRecebimento.id, pesagemId));

  const [aggregate] = await db
    .select({
      totalPeso: sum(pesagensRecebimento.pesoKg),
      totalCaixas: count(pesagensRecebimento.id),
    })
    .from(pesagensRecebimento)
    .where(eq(pesagensRecebimento.recebimentoItemId, recebimentoItemId));

  const remainingCount = Number(aggregate?.totalCaixas ?? 0);

  if (remainingCount === 0) {
    await db
      .delete(itensRecebimento)
      .where(eq(itensRecebimento.id, recebimentoItemId));
  } else {
    await db
      .update(itensRecebimento)
      .set({
        quantidadeRecebida: String(remainingCount),
        pesoRecebido: aggregate?.totalPeso ?? '0',
      })
      .where(eq(itensRecebimento.id, recebimentoItemId));
  }

  return {
    pesagemId,
    removed: true,
    produtoId,
    recebimentoItemId,
    itemRemoved: remainingCount === 0,
  };
}
