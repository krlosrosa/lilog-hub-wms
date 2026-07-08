import { and, eq, inArray, isNull } from 'drizzle-orm';

import type {
  AtualizarStatusDemandaInput,
  AtualizarStatusDemandaResult,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoAvarias,
  devolucaoEventos,
  devolucaoItens,
  devolucaoNotasFiscais,
} from '../providers/drizzle/config/migrations/schema.js';

export async function atualizarStatusDemandaDevolucaoDb(
  db: DrizzleClient,
  demandaId: string,
  unidadeId: string,
  input: AtualizarStatusDemandaInput,
): Promise<AtualizarStatusDemandaResult | null> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: demandasDevolucao.id,
        codigoDemanda: demandasDevolucao.codigoDemanda,
        status: demandasDevolucao.status,
        observacao: demandasDevolucao.observacao,
        doca: demandasDevolucao.doca,
        cargaSegregada: demandasDevolucao.cargaSegregada,
        paletesEsperados: demandasDevolucao.paletesEsperados,
      })
      .from(demandasDevolucao)
      .where(
        and(
          eq(demandasDevolucao.id, demandaId),
          eq(demandasDevolucao.unidadeId, unidadeId),
        ),
      )
      .limit(1);

    if (!existing) {
      return null;
    }

    const transicionandoParaConcluida =
      input.status === 'concluida' && existing.status !== 'concluida';

    if (transicionandoParaConcluida) {
      const nfRows = await tx
        .select({ id: devolucaoNotasFiscais.id })
        .from(devolucaoNotasFiscais)
        .where(eq(devolucaoNotasFiscais.demandaId, demandaId));

      const nfIds = nfRows.map((nf) => nf.id);

      if (nfIds.length > 0) {
        const itensPendentes = await tx
          .select({ id: devolucaoItens.id })
          .from(devolucaoItens)
          .where(
            and(
              inArray(devolucaoItens.devolucaoNfId, nfIds),
              isNull(devolucaoItens.qtdConferida),
            ),
          );

        if (itensPendentes.length > 0) {
          const ids = itensPendentes.map((item) => item.id);

          await tx
            .update(devolucaoItens)
            .set({ qtdConferida: 0 })
            .where(inArray(devolucaoItens.id, ids));

          await tx.insert(devolucaoAvarias).values(
            itensPendentes.map((item) => ({
              demandaId,
              itemId: item.id,
              tipo: 'falta',
              observacao:
                'Registrado automaticamente — item não conferido ao finalizar devolução',
              criadoPorUserId: input.criadoPorUserId ?? null,
            })),
          );
        }
      }
    }

    const now = new Date();
    const concluidaAt = input.status === 'concluida' ? now : null;

    const [updated] = await tx
      .update(demandasDevolucao)
      .set({
        status: input.status,
        observacao: input.observacao ?? existing.observacao,
        doca: input.doca !== undefined ? input.doca : existing.doca,
        cargaSegregada:
          input.cargaSegregada !== undefined
            ? input.cargaSegregada
            : existing.cargaSegregada,
        paletesEsperados:
          input.paletesEsperados !== undefined
            ? input.paletesEsperados
            : existing.paletesEsperados,
        updatedAt: now,
        concluidaAt,
      })
      .where(eq(demandasDevolucao.id, demandaId))
      .returning({
        id: demandasDevolucao.id,
        codigoDemanda: demandasDevolucao.codigoDemanda,
        status: demandasDevolucao.status,
        updatedAt: demandasDevolucao.updatedAt,
        concluidaAt: demandasDevolucao.concluidaAt,
      });

    if (!updated) {
      return null;
    }

    await tx.insert(devolucaoEventos).values({
      demandaId,
      statusAnterior: existing.status,
      statusNovo: input.status,
      descricao: input.observacao ?? `Status alterado para ${input.status}`,
      criadoPorUserId: input.criadoPorUserId ?? null,
    });

    return {
      id: updated.id,
      codigoDemanda: updated.codigoDemanda,
      status: updated.status,
      statusAnterior: existing.status,
      updatedAt: updated.updatedAt,
      concluidaAt: updated.concluidaAt,
    };
  });
}
