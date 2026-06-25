import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  notInArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import type { ListEnderecosFilter } from '../../../domain/repositories/endereco/endereco.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  centros,
  enderecos,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapEnderecoRow } from './map-endereco.drizzle.js';

export async function listEnderecosDb(
  db: DrizzleClient,
  filter: ListEnderecosFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];

  if (filter.status) {
    conditions.push(eq(enderecos.status, filter.status));
  }

  if (filter.centroId) {
    conditions.push(eq(enderecos.centroId, filter.centroId));
  }

  if (filter.unidadeId) {
    conditions.push(eq(centros.unidadeId, filter.unidadeId));
  }

  if (filter.tipos && filter.tipos.length > 0) {
    conditions.push(inArray(enderecos.tipo, filter.tipos));
  } else if (filter.tipo) {
    conditions.push(eq(enderecos.tipo, filter.tipo));
  }

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(enderecos.enderecoMascarado, term),
        ilike(enderecos.zona, term),
        ilike(enderecos.rua, term),
      )!,
    );
  }

  if (filter.excludeIds && filter.excludeIds.length > 0) {
    conditions.push(notInArray(enderecos.id, filter.excludeIds));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const orderBy =
    filter.sortBy === 'armazenagem'
      ? [
          sql`${enderecos.prioridadePicking} asc nulls last`,
          asc(enderecos.ocupacaoPercent),
          asc(enderecos.enderecoMascarado),
        ]
      : [desc(enderecos.createdAt)];

  const rows = await db
    .select({
      endereco: enderecos,
      centro: centros,
    })
    .from(enderecos)
    .innerJoin(centros, eq(enderecos.centroId, centros.id))
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enderecos)
    .innerJoin(centros, eq(enderecos.centroId, centros.id))
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  return {
    items: rows.map(({ endereco, centro }) =>
      mapEnderecoRow(endereco, centro),
    ),
    total,
    page,
    limit,
  };
}

export async function getEnderecoKpiDb(
  db: DrizzleClient,
  filter?: { centroId?: string; unidadeId?: string },
) {
  const conditions: SQL[] = [];

  if (filter?.centroId) {
    conditions.push(eq(enderecos.centroId, filter.centroId));
  }

  if (filter?.unidadeId) {
    conditions.push(eq(centros.unidadeId, filter.unidadeId));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const [stats] = await db
    .select({
      totalEnderecos: sql<number>`count(*)::int`,
      ocupacaoGlobalPercent: sql<number>`coalesce(avg(${enderecos.ocupacaoPercent}), 0)::float`,
      posicoesBloqueadas: sql<number>`count(*) filter (where ${enderecos.status} = 'bloqueado')::int`,
      crossDockingAtivos: sql<number>`count(*) filter (where ${enderecos.tipo} = 'cross_docking' and ${enderecos.status} = 'ocupado')::int`,
      enderecosDisponiveis: sql<number>`count(*) filter (where ${enderecos.status} = 'disponivel')::int`,
      enderecosOcupados: sql<number>`count(*) filter (where ${enderecos.status} = 'ocupado')::int`,
    })
    .from(enderecos)
    .innerJoin(centros, eq(enderecos.centroId, centros.id))
    .where(whereClause);

  const taxaOcupacaoGeral = Number(
    (stats?.ocupacaoGlobalPercent ?? 0).toFixed(1),
  );

  return {
    totalEnderecos: stats?.totalEnderecos ?? 0,
    totalEnderecosTrendPercent: 0,
    ocupacaoGlobalPercent: taxaOcupacaoGeral,
    posicoesBloqueadas: stats?.posicoesBloqueadas ?? 0,
    crossDockingAtivos: stats?.crossDockingAtivos ?? 0,
    enderecosDisponiveis: stats?.enderecosDisponiveis ?? 0,
    enderecosOcupados: stats?.enderecosOcupados ?? 0,
    taxaOcupacaoGeral,
  };
}
