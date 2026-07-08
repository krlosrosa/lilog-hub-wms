import { and, eq, inArray } from 'drizzle-orm';

import type {
  AtualizarStatusGrupoDescargaInput,
  AtualizarStatusGrupoDescargaResult,
  DevolucaoGrupoDescargaStatus,
  RegistrarConferenciaGrupoInput,
  RegistrarConferenciaGrupoResult,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoEventos,
  devolucaoGrupoDemandas,
  devolucaoGruposDescarga,
  devolucaoItens,
  devolucaoItensNaoContabeis,
  devolucaoNotasFiscais,
} from '../providers/drizzle/config/migrations/schema.js';

type DbExecutor = Pick<DrizzleClient, 'select' | 'update' | 'insert'>;

async function recalcularStatusDemandasGrupo(
  tx: DbExecutor,
  demandaIds: string[],
): Promise<string[]> {
  const demandasAtualizadas: string[] = [];

  for (const demandaId of demandaIds) {
    const nfRows = await tx
      .select({ id: devolucaoNotasFiscais.id })
      .from(devolucaoNotasFiscais)
      .where(eq(devolucaoNotasFiscais.demandaId, demandaId));

    const nfIds = nfRows.map((nf) => nf.id);
    if (nfIds.length === 0) continue;

    const itemRows = await tx
      .select({ qtdConferida: devolucaoItens.qtdConferida })
      .from(devolucaoItens)
      .where(inArray(devolucaoItens.devolucaoNfId, nfIds));

    const todosConferidos =
      itemRows.length > 0 &&
      itemRows.every(
        (item) => item.qtdConferida !== null && item.qtdConferida !== undefined,
      );

    if (!todosConferidos) continue;

    const [demanda] = await tx
      .select({ id: demandasDevolucao.id, status: demandasDevolucao.status })
      .from(demandasDevolucao)
      .where(eq(demandasDevolucao.id, demandaId))
      .limit(1);

    if (!demanda || demanda.status === 'conferida' || demanda.status === 'concluida') {
      continue;
    }

    const now = new Date();

    await tx
      .update(demandasDevolucao)
      .set({ status: 'conferida', updatedAt: now })
      .where(eq(demandasDevolucao.id, demandaId));

    await tx.insert(devolucaoEventos).values({
      demandaId,
      statusAnterior: demanda.status,
      statusNovo: 'conferida',
      descricao: 'Conferência concluída via grupo de descarga',
    });

    demandasAtualizadas.push(demandaId);
  }

  return demandasAtualizadas;
}

export async function atualizarStatusGrupoDescargaDevolucaoDb(
  db: DrizzleClient,
  input: AtualizarStatusGrupoDescargaInput,
): Promise<AtualizarStatusGrupoDescargaResult | null> {
  return db.transaction(async (tx) => {
    const [grupo] = await tx
      .select({
        id: devolucaoGruposDescarga.id,
        codigoGrupo: devolucaoGruposDescarga.codigoGrupo,
        status: devolucaoGruposDescarga.status,
      })
      .from(devolucaoGruposDescarga)
      .where(
        and(
          eq(devolucaoGruposDescarga.id, input.grupoId),
          eq(devolucaoGruposDescarga.unidadeId, input.unidadeId),
        ),
      )
      .limit(1);

    if (!grupo) {
      return null;
    }

    const now = new Date();
    const updates: Partial<typeof devolucaoGruposDescarga.$inferInsert> = {
      status: input.status,
      updatedAt: now,
    };

    if (input.status === 'em_conferencia' && grupo.status !== 'em_conferencia') {
      updates.startedAt = now;
    }

    if (input.status === 'concluida' || input.status === 'conferida') {
      updates.finishedAt = now;
    }

    await tx
      .update(devolucaoGruposDescarga)
      .set(updates)
      .where(eq(devolucaoGruposDescarga.id, grupo.id));

    if (input.status === 'em_conferencia') {
      const links = await tx
        .select({ demandaId: devolucaoGrupoDemandas.demandaId })
        .from(devolucaoGrupoDemandas)
        .where(eq(devolucaoGrupoDemandas.grupoId, grupo.id));

      for (const link of links) {
        await tx
          .update(demandasDevolucao)
          .set({ status: 'em_execucao', updatedAt: now })
          .where(eq(demandasDevolucao.id, link.demandaId));
      }
    }

    if (input.status === 'concluida') {
      const links = await tx
        .select({ demandaId: devolucaoGrupoDemandas.demandaId })
        .from(devolucaoGrupoDemandas)
        .where(eq(devolucaoGrupoDemandas.grupoId, grupo.id));

      for (const link of links) {
        await tx
          .update(demandasDevolucao)
          .set({ status: 'concluida', updatedAt: now, concluidaAt: now })
          .where(eq(demandasDevolucao.id, link.demandaId));
      }
    }

    return {
      id: grupo.id,
      codigoGrupo: grupo.codigoGrupo,
      status: input.status,
      statusAnterior: grupo.status as DevolucaoGrupoDescargaStatus,
      updatedAt: now,
    };
  });
}

export async function registrarConferenciaGrupoDescargaDb(
  db: DrizzleClient,
  input: RegistrarConferenciaGrupoInput,
): Promise<RegistrarConferenciaGrupoResult | null> {
  return db.transaction(async (tx) => {
    const [grupo] = await tx
      .select({
        id: devolucaoGruposDescarga.id,
        status: devolucaoGruposDescarga.status,
      })
      .from(devolucaoGruposDescarga)
      .where(
        and(
          eq(devolucaoGruposDescarga.id, input.grupoId),
          eq(devolucaoGruposDescarga.unidadeId, input.unidadeId),
        ),
      )
      .limit(1);

    if (!grupo) {
      return null;
    }

    const links = await tx
      .select({ demandaId: devolucaoGrupoDemandas.demandaId })
      .from(devolucaoGrupoDemandas)
      .where(eq(devolucaoGrupoDemandas.grupoId, grupo.id));

    const demandaIds = links.map((link) => link.demandaId);
    const demandaIdSet = new Set(demandaIds);

    const nfRows =
      demandaIds.length > 0
        ? await tx
            .select({
              id: devolucaoNotasFiscais.id,
              demandaId: devolucaoNotasFiscais.demandaId,
            })
            .from(devolucaoNotasFiscais)
            .where(inArray(devolucaoNotasFiscais.demandaId, demandaIds))
        : [];

    const nfIds = nfRows.map((nf) => nf.id);
    let itensAtualizados = 0;

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
        if (!validItemIds.has(item.itemId)) continue;

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

    let itensNaoContabeisRegistrados = 0;

    if (input.itensNaoContabeis && input.itensNaoContabeis.length > 0) {
      for (const item of input.itensNaoContabeis) {
        if (item.demandaId && !demandaIdSet.has(item.demandaId)) {
          continue;
        }

        await tx.insert(devolucaoItensNaoContabeis).values({
          unidadeId: input.unidadeId,
          grupoDescargaId: grupo.id,
          demandaId: item.demandaId ?? null,
          sku: item.sku,
          descricaoProduto: item.descricaoProduto ?? null,
          quantidadeConferida: String(item.quantidadeConferida),
          unidadeMedida: item.unidadeMedida,
          lote: item.lote ?? null,
          dataFabricacao: item.dataFabricacao ?? null,
          condicao: item.condicao ?? 'nao_identificado',
          observacao: item.observacao ?? null,
          criadoPorUserId: input.criadoPorUserId ?? null,
        });

        itensNaoContabeisRegistrados += 1;
      }
    }

    const demandasAtualizadas = await recalcularStatusDemandasGrupo(
      tx,
      demandaIds,
    );

    let statusAtualizado: DevolucaoGrupoDescargaStatus | undefined;
    const now = new Date();

    if (input.status && input.status !== grupo.status) {
      await tx
        .update(devolucaoGruposDescarga)
        .set({
          status: input.status,
          updatedAt: now,
          finishedAt:
            input.status === 'conferida' || input.status === 'concluida'
              ? now
              : undefined,
        })
        .where(eq(devolucaoGruposDescarga.id, grupo.id));

      statusAtualizado = input.status;
    } else if (demandasAtualizadas.length === demandaIds.length && demandaIds.length > 0) {
      await tx
        .update(devolucaoGruposDescarga)
        .set({
          status: 'conferida',
          updatedAt: now,
          finishedAt: now,
        })
        .where(eq(devolucaoGruposDescarga.id, grupo.id));

      statusAtualizado = 'conferida';
    } else if (grupo.status === 'aguardando_conferencia') {
      await tx
        .update(devolucaoGruposDescarga)
        .set({
          status: 'em_conferencia',
          updatedAt: now,
          startedAt: now,
        })
        .where(eq(devolucaoGruposDescarga.id, grupo.id));

      statusAtualizado = 'em_conferencia';
    }

    return {
      grupoId: grupo.id,
      itensAtualizados,
      itensNaoContabeisRegistrados,
      status: statusAtualizado,
      demandasAtualizadas,
    };
  });
}
