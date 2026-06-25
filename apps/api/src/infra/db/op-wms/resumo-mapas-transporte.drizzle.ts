import { and, eq, inArray, isNull, notExists, sql } from 'drizzle-orm';

import type { MapaResumoTransporteRecord } from '../../../domain/repositories/op-wms/demanda-separacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { totalPaletesTransportesDb } from '../expedicao/total-paletes-transporte.drizzle.js';
import {
  demandasSeparacao,
  mapaGrupos,
  mapaLotes,
} from '../providers/drizzle/config/migrations/schema.js';

export async function resumoMapasTransportesDb(
  db: DrizzleClient,
  unidadeId: string,
  transporteIds: string[],
): Promise<MapaResumoTransporteRecord[]> {
  if (transporteIds.length === 0) {
    return [];
  }

  const demandasAtivasSubquery = db
    .select({ id: demandasSeparacao.id })
    .from(demandasSeparacao)
    .where(
      and(
        eq(demandasSeparacao.mapaGrupoId, mapaGrupos.id),
        inArray(demandasSeparacao.status, ['pendente', 'em_andamento']),
      ),
    );

  const rows = await db
    .select({
      transporteId: mapaGrupos.transporteId,
      totalMapas: sql<number>`count(*)::int`,
      pesoTotalKg: sql<number>`coalesce(sum(${mapaGrupos.pesoTotal}), 0)`,
      totalCaixas: sql<number>`coalesce(sum(coalesce((${mapaGrupos.cabecalho}->>'totalCaixas')::int, 0)), 0)`,
      totalUnidades: sql<number>`coalesce(sum(coalesce((${mapaGrupos.cabecalho}->>'totalUnidades')::int, 0)), 0)`,
      tempoTotalMinutos: sql<number>`coalesce(sum(${mapaGrupos.tempoEsperado}), 0)`,
    })
    .from(mapaGrupos)
    .innerJoin(mapaLotes, eq(mapaGrupos.mapaLoteId, mapaLotes.id))
    .where(
      and(
        eq(mapaLotes.unidadeId, unidadeId),
        eq(mapaGrupos.processo, 'separacao'),
        inArray(mapaGrupos.transporteId, transporteIds),
        isNull(mapaGrupos.finalizadoEm),
        isNull(mapaGrupos.iniciadoEm),
        notExists(demandasAtivasSubquery),
      ),
    )
    .groupBy(mapaGrupos.transporteId);

  const porTransporte = new Map(
    rows.map((row) => [
      row.transporteId,
      {
        transporteId: row.transporteId,
        totalMapas: Number(row.totalMapas),
        pesoTotalKg: Number(row.pesoTotalKg),
        totalCaixas: Number(row.totalCaixas),
        totalUnidades: Number(row.totalUnidades),
        totalPaletes: 0,
        tempoTotalMinutos: Number(row.tempoTotalMinutos),
      },
    ]),
  );

  const paletesPorTransporte = await totalPaletesTransportesDb(db, {
    unidadeId,
    transporteIds,
  });

  return transporteIds.map((transporteId) => {
    const resumo = porTransporte.get(transporteId) ?? {
      transporteId,
      totalMapas: 0,
      pesoTotalKg: 0,
      totalCaixas: 0,
      totalUnidades: 0,
      totalPaletes: 0,
      tempoTotalMinutos: 0,
    };

    return {
      ...resumo,
      totalPaletes: paletesPorTransporte.get(transporteId) ?? 0,
    };
  });
}
