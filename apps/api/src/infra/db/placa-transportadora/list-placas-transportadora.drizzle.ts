import { and, asc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';

import type { ListPlacasTransportadoraFilter } from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  perfisTarifas,
  transportadoraPlacas,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapPlacaTransportadoraRow } from './map-placa-transportadora.drizzle.js';

export async function listPlacasTransportadoraDb(
  db: DrizzleClient,
  filter: ListPlacasTransportadoraFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 50;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [
    eq(transportadoraPlacas.transportadoraId, filter.transportadoraId),
  ];

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;

    conditions.push(
      or(
        ilike(transportadoraPlacas.placa, term),
        ilike(transportadoraPlacas.tipoVeiculoNome, term),
      )!,
    );
  }

  if (filter.tipoVeiculo?.trim()) {
    conditions.push(
      eq(transportadoraPlacas.tipoVeiculoNome, filter.tipoVeiculo.trim()),
    );
  }

  const whereClause = and(...conditions);

  const rows = await db
    .select({
      placa: transportadoraPlacas,
      perfilTarifaNome: perfisTarifas.nome,
    })
    .from(transportadoraPlacas)
    .leftJoin(
      perfisTarifas,
      eq(transportadoraPlacas.perfilTarifaId, perfisTarifas.id),
    )
    .where(whereClause)
    .orderBy(asc(transportadoraPlacas.placa))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transportadoraPlacas)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  return {
    items: rows.map((row) =>
      mapPlacaTransportadoraRow(row.placa, row.perfilTarifaNome),
    ),
    total,
    page,
    limit,
  };
}
