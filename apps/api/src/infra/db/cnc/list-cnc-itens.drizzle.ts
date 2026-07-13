import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';

import type { ListCncItensFilter } from '../../../domain/repositories/cnc/cnc.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  cncItens,
  naoConformidades,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapCncItemRow } from './map-cnc.drizzle.js';

function normalizarIntervaloData(filter: {
  dataInicio: string;
  dataFim: string;
}): { dataInicio: string; dataFim: string } {
  if (filter.dataInicio <= filter.dataFim) {
    return filter;
  }

  return {
    dataInicio: filter.dataFim,
    dataFim: filter.dataInicio,
  };
}

function limitesIntervaloUtcMenos3(
  dataInicio: string,
  dataFim: string,
): { inicio: Date; fim: Date } {
  return {
    inicio: new Date(`${dataInicio}T00:00:00-03:00`),
    fim: new Date(`${dataFim}T23:59:59.999-03:00`),
  };
}

export async function listCncItensDb(
  db: DrizzleClient,
  filter: ListCncItensFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;
  const { dataInicio, dataFim } = normalizarIntervaloData(filter);
  const { inicio, fim } = limitesIntervaloUtcMenos3(dataInicio, dataFim);

  const conditions: SQL[] = [
    eq(naoConformidades.unidadeId, filter.unidadeId),
    gte(cncItens.createdAt, inicio),
    lte(cncItens.createdAt, fim),
  ];

  if (filter.situacao) {
    conditions.push(eq(naoConformidades.situacao, filter.situacao));
  }

  if (filter.tipo) {
    conditions.push(eq(cncItens.tipo, filter.tipo));
  }

  const whereClause = and(...conditions);

  const rows = await db
    .select({
      item: cncItens,
      cncNumero: naoConformidades.numero,
      cncSituacao: naoConformidades.situacao,
    })
    .from(cncItens)
    .innerJoin(naoConformidades, eq(cncItens.cncId, naoConformidades.id))
    .where(whereClause)
    .orderBy(desc(cncItens.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cncItens)
    .innerJoin(naoConformidades, eq(cncItens.cncId, naoConformidades.id))
    .where(whereClause);

  return {
    items: rows.map((row) => ({
      ...mapCncItemRow(row.item),
      cncNumero: row.cncNumero,
      cncSituacao: row.cncSituacao,
    })),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  };
}
