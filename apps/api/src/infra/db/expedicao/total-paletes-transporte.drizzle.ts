import { and, eq, inArray, sql } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  mapaGrupos,
  transportes,
} from '../providers/drizzle/config/migrations/schema.js';

type TotalPaletesTransporteFiltro = {
  unidadeId: string;
  uploadLoteId?: string;
  transporteIds?: string[];
};

export async function totalPaletesTransportesDb(
  db: DrizzleClient,
  filtro: TotalPaletesTransporteFiltro,
): Promise<Map<string, number>> {
  const conditions = [
    eq(transportes.unidadeId, filtro.unidadeId),
    eq(mapaGrupos.processo, 'carregamento'),
    eq(mapaGrupos.mapaLoteId, transportes.ultimoMapaLoteId),
  ];

  if (filtro.uploadLoteId) {
    conditions.push(eq(transportes.uploadLoteId, filtro.uploadLoteId));
  }

  if (filtro.transporteIds && filtro.transporteIds.length > 0) {
    conditions.push(inArray(mapaGrupos.transporteId, filtro.transporteIds));
  }

  const rows = await db
    .select({
      transporteId: mapaGrupos.transporteId,
      totalPaletes: sql<number>`coalesce((${mapaGrupos.cabecalho}->>'totalPaletes')::int, 0)`,
    })
    .from(mapaGrupos)
    .innerJoin(transportes, eq(mapaGrupos.transporteId, transportes.numeroTransporte))
    .where(and(...conditions));

  return new Map(
    rows.map((row) => [row.transporteId, Number(row.totalPaletes)]),
  );
}
