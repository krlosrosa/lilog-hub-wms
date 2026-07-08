import { and, eq, inArray } from 'drizzle-orm';

import type {
  RegistrarConferenciaItensInput,
  RegistrarConferenciaItensResult,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoEventos,
  devolucaoItens,
  devolucaoNotasFiscais,
} from '../providers/drizzle/config/migrations/schema.js';

export async function registrarConferenciaItensDb(
  db: DrizzleClient,
  input: RegistrarConferenciaItensInput,
): Promise<RegistrarConferenciaItensResult | null> {
  return db.transaction(async (tx) => {
    const [demanda] = await tx
      .select({
        id: demandasDevolucao.id,
        status: demandasDevolucao.status,
        observacao: demandasDevolucao.observacao,
      })
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

    let itensAtualizados = 0;

    const nfRows = await tx
      .select({ id: devolucaoNotasFiscais.id })
      .from(devolucaoNotasFiscais)
      .where(eq(devolucaoNotasFiscais.demandaId, demanda.id));

    const nfIds = nfRows.map((nf) => nf.id);

    if (input.itens && input.itens.length > 0 && nfIds.length > 0) {
      const itemIds = input.itens.map((item) => item.itemId);

      const validItems = await tx
        .select({ id: devolucaoItens.id })
        .from(devolucaoItens)
        .where(
          and(
            inArray(devolucaoItens.id, itemIds),
            inArray(devolucaoItens.devolucaoNfId, nfIds),
          ),
        );

      const validItemIds = new Set(validItems.map((item) => item.id));

      for (const item of input.itens) {
        if (!validItemIds.has(item.itemId)) {
          continue;
        }

        await tx
          .update(devolucaoItens)
          .set({
            qtdConferida: item.qtdConferida,
            lote: item.lote ?? undefined,
            dataFabricacao: item.dataFabricacao ?? undefined,
            condicao: item.condicao ?? undefined,
            observacao: item.observacao ?? undefined,
          })
          .where(eq(devolucaoItens.id, item.itemId));

        itensAtualizados += 1;
      }
    }

    let statusAtualizado: RegistrarConferenciaItensResult['status'];

    if (input.status && input.status !== demanda.status) {
      const now = new Date();
      const concluidaAt = input.status === 'concluida' ? now : null;

      await tx
        .update(demandasDevolucao)
        .set({
          status: input.status,
          updatedAt: now,
          concluidaAt,
        })
        .where(eq(demandasDevolucao.id, demanda.id));

      await tx.insert(devolucaoEventos).values({
        demandaId: demanda.id,
        statusAnterior: demanda.status,
        statusNovo: input.status,
        descricao: `Conferência registrada — status ${input.status}`,
        criadoPorUserId: input.criadoPorUserId ?? null,
      });

      statusAtualizado = input.status;
    }

    return {
      demandaId: demanda.id,
      itensAtualizados,
      status: statusAtualizado,
    };
  });
}
