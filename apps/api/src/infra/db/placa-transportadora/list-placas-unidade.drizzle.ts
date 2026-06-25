import { and, asc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';

import type { ListPlacasUnidadeFilter } from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  perfisTarifas,
  transportadoraPlacas,
  transportadoras,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapPlacaTransportadoraRow } from './map-placa-transportadora.drizzle.js';

export async function listPlacasUnidadeDb(
  db: DrizzleClient,
  filter: ListPlacasUnidadeFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 50;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(transportadoras.unidadeId, filter.unidadeId)];

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;

    conditions.push(
      or(
        ilike(transportadoraPlacas.placa, term),
        ilike(transportadoraPlacas.tipoVeiculoNome, term),
        ilike(transportadoras.nome, term),
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
    .where(whereClause)
    .orderBy(asc(transportadoras.nome), asc(transportadoraPlacas.placa))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transportadoraPlacas)
    .innerJoin(
      transportadoras,
      eq(transportadoraPlacas.transportadoraId, transportadoras.id),
    )
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  return {
    items: rows.map((row) => ({
      ...mapPlacaTransportadoraRow(row.placa, row.perfilTarifaNome),
      transportadoraNome: row.transportadoraNome,
    })),
    total,
    page,
    limit,
  };
}
