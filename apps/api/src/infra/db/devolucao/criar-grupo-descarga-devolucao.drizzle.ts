import { and, count, eq, inArray, sql } from 'drizzle-orm';

import type {
  CriarGrupoDescargaInput,
  CriarGrupoDescargaResult,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoGrupoDemandas,
  devolucaoGruposDescarga,
} from '../providers/drizzle/config/migrations/schema.js';

const STATUS_ELEGIVEIS_AGRUPAMENTO = ['aberta', 'em_analise'] as const;

export async function criarGrupoDescargaDevolucaoDb(
  db: DrizzleClient,
  input: CriarGrupoDescargaInput,
): Promise<CriarGrupoDescargaResult> {
  return db.transaction(async (tx) => {
    const demandaRows = await tx
      .select({
        id: demandasDevolucao.id,
        status: demandasDevolucao.status,
      })
      .from(demandasDevolucao)
      .where(
        and(
          eq(demandasDevolucao.unidadeId, input.unidadeId),
          inArray(demandasDevolucao.id, input.demandaIds),
        ),
      );

    if (demandaRows.length !== input.demandaIds.length) {
      throw new Error('Uma ou mais demandas não foram encontradas na unidade.');
    }

    const demandaInvalida = demandaRows.find(
      (demanda) =>
        !STATUS_ELEGIVEIS_AGRUPAMENTO.includes(
          demanda.status as (typeof STATUS_ELEGIVEIS_AGRUPAMENTO)[number],
        ),
    );

    if (demandaInvalida) {
      throw new Error(
        'Somente demandas com status Aberta ou Em Análise podem ser agrupadas.',
      );
    }

    const demandasJaAgrupadas = await tx
      .select({ demandaId: devolucaoGrupoDemandas.demandaId })
      .from(devolucaoGrupoDemandas)
      .where(inArray(devolucaoGrupoDemandas.demandaId, input.demandaIds));

    if (demandasJaAgrupadas.length > 0) {
      throw new Error('Uma ou mais demandas já pertencem a um grupo de descarga.');
    }

    const [countRow] = await tx
      .select({ total: count() })
      .from(devolucaoGruposDescarga)
      .where(eq(devolucaoGruposDescarga.unidadeId, input.unidadeId));

    const codigoGrupo = `GRP-${String(Number(countRow?.total ?? 0) + 1).padStart(5, '0')}`;
    const now = new Date();
    const statusInicial = input.liberarConferencia
      ? ('em_conferencia' as const)
      : ('aguardando_conferencia' as const);

    const [grupo] = await tx
      .insert(devolucaoGruposDescarga)
      .values({
        unidadeId: input.unidadeId,
        codigoGrupo,
        placaDescarga: input.placaDescarga,
        doca: input.doca ?? null,
        cargaSegregada: input.cargaSegregada ?? false,
        paletesEsperados: input.paletesEsperados ?? null,
        observacao: input.observacao ?? null,
        status: statusInicial,
        criadoPorUserId: input.criadoPorUserId ?? null,
        startedAt: input.liberarConferencia ? now : null,
      })
      .returning({
        id: devolucaoGruposDescarga.id,
        codigoGrupo: devolucaoGruposDescarga.codigoGrupo,
        status: devolucaoGruposDescarga.status,
      });

    if (!grupo) {
      throw new Error('Falha ao criar grupo de descarga.');
    }

    await tx.insert(devolucaoGrupoDemandas).values(
      input.demandaIds.map((demandaId) => ({
        grupoId: grupo.id,
        demandaId,
      })),
    );

    const demandaStatus = input.liberarConferencia ? 'em_execucao' : 'em_analise';

    for (const demandaId of input.demandaIds) {
      await tx
        .update(demandasDevolucao)
        .set({
          status: demandaStatus,
          doca: input.doca ?? undefined,
          cargaSegregada: input.cargaSegregada ?? false,
          paletesEsperados: input.paletesEsperados ?? undefined,
          updatedAt: now,
        })
        .where(eq(demandasDevolucao.id, demandaId));
    }

    return {
      id: grupo.id,
      codigoGrupo: grupo.codigoGrupo,
      status: grupo.status,
      totalDemandas: input.demandaIds.length,
    };
  });
}

export async function demandaIdsEmGrupoAtivoDb(
  db: DrizzleClient,
  unidadeId: string,
): Promise<Set<string>> {
  const rows = await db
    .select({ demandaId: devolucaoGrupoDemandas.demandaId })
    .from(devolucaoGrupoDemandas)
    .innerJoin(
      devolucaoGruposDescarga,
      eq(devolucaoGrupoDemandas.grupoId, devolucaoGruposDescarga.id),
    )
    .where(
      and(
        eq(devolucaoGruposDescarga.unidadeId, unidadeId),
        sql`${devolucaoGruposDescarga.status} not in ('concluida', 'cancelada')`,
      ),
    );

  return new Set(rows.map((row) => row.demandaId));
}
