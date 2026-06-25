import { and, asc, eq, sql, type SQL } from 'drizzle-orm';

import type { BuscarPlacasUnidadeFilter } from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  perfisTarifas,
  transportadoraPlacas,
  transportadoras,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapPlacaTransportadoraRow } from './map-placa-transportadora.drizzle.js';

const placaNormalizadaExpr = sql<string>`upper(left(split_part(${transportadoraPlacas.placa}, '-', 1), 7))`;

export async function buscarPlacasUnidadeDb(
  db: DrizzleClient,
  filter: BuscarPlacasUnidadeFilter,
) {
  const placas = [...new Set(filter.placas.map((placa) => placa.trim().toUpperCase()))];

  if (placas.length === 0) {
    return { items: [] };
  }

  const conditions: SQL[] = [
    eq(transportadoras.unidadeId, filter.unidadeId),
    sql`${placaNormalizadaExpr} = ANY(ARRAY[${sql.join(
      placas.map((placa) => sql`${placa}`),
      sql`, `,
    )}]::text[])`,
  ];

  const rows = await db
    .select({
      placa: transportadoraPlacas,
      transportadoraNome: transportadoras.nome,
      perfilTarifaNome: perfisTarifas.nome,
    })
    .from(transportadoraPlacas)
    .innerJoin(
      transportadoras,
      eq(transportadoraPlacas.transportadoraId, transportadoras.id),
    )
    .leftJoin(
      perfisTarifas,
      eq(transportadoraPlacas.perfilTarifaId, perfisTarifas.id),
    )
    .where(and(...conditions))
    .orderBy(asc(transportadoras.nome), asc(transportadoraPlacas.placa));

  return {
    items: rows.map((row) => ({
      ...mapPlacaTransportadoraRow(row.placa, row.perfilTarifaNome),
      transportadoraNome: row.transportadoraNome,
    })),
  };
}
