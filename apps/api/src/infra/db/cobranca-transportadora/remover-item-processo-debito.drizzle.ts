import { and, count, eq, sql } from 'drizzle-orm';

import { montarEventoRemocaoItem } from '../../../application/services/cobranca-transportadora/registrar-evento-item-processo-debito.js';
import type {
  RemoverItemProcessoInput,
  RemoverItemProcessoResult,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  cobrancaEventos,
  processoDebitoItens,
  processosDebito,
} from '../providers/drizzle/config/migrations/schema.js';

function recalcularValorTotalProcesso(processoId: string) {
  return sql<string>`coalesce(sum(case when ${processoDebitoItens.status} = 'cobrar' then ${processoDebitoItens.valorDebito} else 0 end), 0)`;
}

export async function removerItemProcessoDebitoDb(
  db: DrizzleClient,
  input: RemoverItemProcessoInput,
): Promise<RemoverItemProcessoResult | null> {
  return db.transaction(async (tx) => {
    const [processo] = await tx
      .select({ id: processosDebito.id })
      .from(processosDebito)
      .where(
        and(
          eq(processosDebito.id, input.processoId),
          eq(processosDebito.unidadeId, input.unidadeId),
        ),
      )
      .limit(1);

    if (!processo) return null;

    const [existingItem] = await tx
      .select({
        id: processoDebitoItens.id,
        processoDebitoId: processoDebitoItens.processoDebitoId,
        sku: processoDebitoItens.sku,
        descricaoProduto: processoDebitoItens.descricaoProduto,
      })
      .from(processoDebitoItens)
      .where(
        and(
          eq(processoDebitoItens.id, input.itemId),
          eq(processoDebitoItens.processoDebitoId, input.processoId),
        ),
      )
      .limit(1);

    if (!existingItem) return null;

    const now = new Date();

    await tx
      .delete(processoDebitoItens)
      .where(eq(processoDebitoItens.id, input.itemId));

    const [totals] = await tx
      .select({
        valorTotal: recalcularValorTotalProcesso(input.processoId),
      })
      .from(processoDebitoItens)
      .where(eq(processoDebitoItens.processoDebitoId, input.processoId));

    const [contagem] = await tx
      .select({ total: count() })
      .from(processoDebitoItens)
      .where(eq(processoDebitoItens.processoDebitoId, input.processoId));

    const quantidadeItens = Number(contagem?.total ?? 0);
    const valorTotalProcesso = Number(totals?.valorTotal ?? 0);

    await tx
      .update(processosDebito)
      .set({
        valorTotal: String(valorTotalProcesso),
        quantidadeItens,
        updatedAt: now,
      })
      .where(eq(processosDebito.id, input.processoId));

    const evento = montarEventoRemocaoItem({
      sku: existingItem.sku,
      descricaoProduto: existingItem.descricaoProduto,
    });

    await tx.insert(cobrancaEventos).values({
      entidadeTipo: 'processo',
      entidadeId: input.processoId,
      statusAnterior: null,
      statusNovo: evento.statusNovo,
      descricao: evento.descricao,
      criadoPorUserId: input.criadoPorUserId ?? null,
    });

    return {
      id: existingItem.id,
      processoDebitoId: existingItem.processoDebitoId,
      valorTotalProcesso,
      quantidadeItens,
    };
  });
}
