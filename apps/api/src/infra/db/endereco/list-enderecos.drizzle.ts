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

import { applyOcupacaoFromSaldoToEndereco } from '../../../domain/services/resolve-endereco-ocupacao-from-saldo.js';
import type { ListEnderecosFilter } from '../../../domain/repositories/endereco/endereco.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  enderecos,
  unidades,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapEnderecoRow } from './map-endereco.drizzle.js';
import { buildSaldoPorEnderecoSubquery } from './saldo-por-endereco.drizzle.js';

const STATUSES_NAO_OPERACIONAIS = ['bloqueado', 'inventario', 'inativo'] as const;

function appendStatusFilter(
  conditions: SQL[],
  status: ListEnderecosFilter['status'],
  saldoPorEndereco: ReturnType<typeof buildSaldoPorEnderecoSubquery>,
) {
  if (!status) {
    return;
  }

  if (status === 'ocupado') {
    conditions.push(
      notInArray(enderecos.status, [...STATUSES_NAO_OPERACIONAIS]),
      sql`coalesce(${saldoPorEndereco.totalQuantidade}, 0) > 0`,
    );
    return;
  }

  if (status === 'disponivel') {
    conditions.push(
      notInArray(enderecos.status, [...STATUSES_NAO_OPERACIONAIS]),
      sql`coalesce(${saldoPorEndereco.totalQuantidade}, 0) = 0`,
    );
    return;
  }

  conditions.push(eq(enderecos.status, status));
}

export async function listEnderecosDb(
  db: DrizzleClient,
  filter: ListEnderecosFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;
  const saldoPorEndereco = buildSaldoPorEnderecoSubquery(db);

  const conditions: SQL[] = [];

  appendStatusFilter(conditions, filter.status, saldoPorEndereco);

  if (filter.unidadeId) {
    conditions.push(eq(enderecos.unidadeId, filter.unidadeId));
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
      unidade: unidades,
      totalSaldoQuantidade: sql<string>`coalesce(${saldoPorEndereco.totalQuantidade}, 0)`.as(
        'total_saldo_quantidade',
      ),
    })
    .from(enderecos)
    .innerJoin(unidades, eq(enderecos.unidadeId, unidades.id))
    .leftJoin(saldoPorEndereco, eq(enderecos.id, saldoPorEndereco.enderecoId))
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enderecos)
    .innerJoin(unidades, eq(enderecos.unidadeId, unidades.id))
    .leftJoin(saldoPorEndereco, eq(enderecos.id, saldoPorEndereco.enderecoId))
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  return {
    items: rows.map(({ endereco, unidade, totalSaldoQuantidade }) =>
      applyOcupacaoFromSaldoToEndereco(
        mapEnderecoRow(endereco, unidade),
        Number(totalSaldoQuantidade ?? 0),
      ),
    ),
    total,
    page,
    limit,
  };
}

export async function getEnderecoKpiDb(
  db: DrizzleClient,
  filter?: { unidadeId?: string },
) {
  const saldoPorEndereco = buildSaldoPorEnderecoSubquery(db);
  const conditions: SQL[] = [];

  if (filter?.unidadeId) {
    conditions.push(eq(enderecos.unidadeId, filter.unidadeId));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const [stats] = await db
    .select({
      totalEnderecos: sql<number>`count(*)::int`,
      ocupacaoGlobalPercent: sql<number>`coalesce(avg(
        case
          when coalesce(${saldoPorEndereco.totalQuantidade}, 0) > 0
          then greatest(${enderecos.ocupacaoPercent}::float, 100)
          else 0
        end
      ), 0)::float`,
      posicoesBloqueadas: sql<number>`count(*) filter (where ${enderecos.status} = 'bloqueado')::int`,
      crossDockingAtivos: sql<number>`count(*) filter (where ${enderecos.tipo} = 'cross_docking' and coalesce(${saldoPorEndereco.totalQuantidade}, 0) > 0)::int`,
      enderecosDisponiveis: sql<number>`count(*) filter (where ${enderecos.status} not in ('bloqueado', 'inventario', 'inativo') and coalesce(${saldoPorEndereco.totalQuantidade}, 0) = 0)::int`,
      enderecosOcupados: sql<number>`count(*) filter (where ${enderecos.status} not in ('bloqueado', 'inventario', 'inativo') and coalesce(${saldoPorEndereco.totalQuantidade}, 0) > 0)::int`,
    })
    .from(enderecos)
    .innerJoin(unidades, eq(enderecos.unidadeId, unidades.id))
    .leftJoin(saldoPorEndereco, eq(enderecos.id, saldoPorEndereco.enderecoId))
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
