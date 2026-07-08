import { and, eq, inArray } from 'drizzle-orm';

import type {
  RegistrarAvariaDevolucaoInput,
  RegistrarAvariaDevolucaoResult,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoAvarias,
  devolucaoItens,
  devolucaoNotasFiscais,
} from '../providers/drizzle/config/migrations/schema.js';

export async function registrarAvariaDevolucaoDb(
  db: DrizzleClient,
  input: RegistrarAvariaDevolucaoInput,
): Promise<RegistrarAvariaDevolucaoResult | null> {
  return db.transaction(async (tx) => {
    const [demanda] = await tx
      .select({ id: demandasDevolucao.id })
      .from(demandasDevolucao)
      .where(
        and(
          eq(demandasDevolucao.id, input.demandaId),
          eq(demandasDevolucao.unidadeId, input.unidadeId),
        ),
      )
      .limit(1);

    if (!demanda) {
      return null;
    }

    const nfRows = await tx
      .select({ id: devolucaoNotasFiscais.id })
      .from(devolucaoNotasFiscais)
      .where(eq(devolucaoNotasFiscais.demandaId, demanda.id));

    const nfIds = nfRows.map((nf) => nf.id);
    const itemIdsToUpdate = new Set<string>();

    if (input.itemId && nfIds.length > 0) {
      const [item] = await tx
        .select({ id: devolucaoItens.id })
        .from(devolucaoItens)
        .where(
          and(
            eq(devolucaoItens.id, input.itemId),
            inArray(devolucaoItens.devolucaoNfId, nfIds),
          ),
        )
        .limit(1);

      if (item) {
        itemIdsToUpdate.add(item.id);
      }
    }

    if (input.replicarSkus && input.replicarSkus.length > 0 && nfIds.length > 0) {
      const skuRows = await tx
        .select({ id: devolucaoItens.id })
        .from(devolucaoItens)
        .where(
          and(
            inArray(devolucaoItens.devolucaoNfId, nfIds),
            inArray(devolucaoItens.sku, input.replicarSkus),
          ),
        );

      skuRows.forEach((row) => itemIdsToUpdate.add(row.id));
    }

    const skusAfetados =
      input.replicarSkus && input.replicarSkus.length > 0
        ? [...new Set(input.replicarSkus)]
        : null;

    const [avaria] = await tx
      .insert(devolucaoAvarias)
      .values({
        demandaId: demanda.id,
        itemId: input.itemId ?? null,
        tipo: input.tipo,
        natureza: input.natureza ?? null,
        causa: input.causa ?? null,
        quantidadeCaixa: input.quantidadeCaixa ?? null,
        quantidadeUnidade: input.quantidadeUnidade ?? null,
        skusAfetados,
        observacao: input.observacao ?? null,
        photoUrls: input.photoUrls ?? [],
        criadoPorUserId: input.criadoPorUserId ?? null,
      })
      .returning({
        id: devolucaoAvarias.id,
        demandaId: devolucaoAvarias.demandaId,
        itemId: devolucaoAvarias.itemId,
      });

    if (!avaria) {
      return null;
    }

    if (itemIdsToUpdate.size > 0) {
      await tx
        .update(devolucaoItens)
        .set({ condicao: 'avariado' })
        .where(inArray(devolucaoItens.id, [...itemIdsToUpdate]));
    }

    return {
      id: avaria.id,
      demandaId: avaria.demandaId,
      itemId: avaria.itemId,
      itensAfetados: itemIdsToUpdate.size,
    };
  });
}
