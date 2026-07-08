import {
  and,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type Column,
  type SQL,
} from 'drizzle-orm';

import type {
  DisponibilidadeEstoqueItem,
  DisponibilidadeEstoqueSummary,
  ListDisponibilidadeEstoqueFilter,
  ListDisponibilidadeEstoqueResult,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  depositos,
  enderecos,
  produtos,
  reservasEstoque,
  saldosEndereco,
} from '../providers/drizzle/config/migrations/schema.js';
import { toQuantityNumber } from './map-estoque.drizzle.js';

const RESERVA_STATUS_ATIVOS = ['ativa', 'parcial'] as const;
const VENCIMENTO_PROXIMO_DIAS = 30;

function toDate(value: Date | string | null | undefined): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

function buildSaldoConditions(filter: ListDisponibilidadeEstoqueFilter): SQL[] {
  const conditions: SQL[] = [eq(saldosEndereco.unidadeId, filter.unidadeId)];

  if (filter.produtoId) {
    conditions.push(eq(saldosEndereco.produtoId, filter.produtoId));
  }

  if (filter.depositoId) {
    conditions.push(eq(saldosEndereco.depositoId, filter.depositoId));
  }

  if (filter.enderecoId) {
    conditions.push(eq(saldosEndereco.enderecoId, filter.enderecoId));
  }

  if (filter.status) {
    conditions.push(eq(saldosEndereco.status, filter.status));
  }

  if (filter.natureza) {
    conditions.push(eq(saldosEndereco.natureza, filter.natureza));
  }

  if (filter.lote?.trim()) {
    conditions.push(eq(saldosEndereco.lote, filter.lote.trim()));
  }

  return conditions;
}

function buildSearchCondition(
  search: string | undefined,
  columns: {
    produtoId: Column;
    lote: Column;
  },
): SQL | undefined {
  const term = search?.trim();
  if (!term) {
    return undefined;
  }

  const pattern = `%${term}%`;

  return or(
    ilike(columns.produtoId, pattern),
    ilike(produtos.sku, pattern),
    ilike(produtos.descricao, pattern),
    ilike(columns.lote, pattern),
    ilike(produtos.grupo, pattern),
    ilike(enderecos.enderecoMascarado, pattern),
    ilike(depositos.codigo, pattern),
    ilike(depositos.nome, pattern),
  );
}

function calcularPesoLiquidoTotalKg(
  saldoFisico: number,
  pesoLiquidoUnidade: string | null | undefined,
): number | null {
  if (pesoLiquidoUnidade == null || pesoLiquidoUnidade === '') {
    return null;
  }

  const pesoPorUnidade = Number(pesoLiquidoUnidade);
  if (!Number.isFinite(pesoPorUnidade) || pesoPorUnidade <= 0) {
    return null;
  }

  return Number((saldoFisico * pesoPorUnidade).toFixed(3));
}

function mapRowToItem(row: {
  produtoId: string;
  produtoSku: string;
  produtoDescricao: string;
  produtoGrupo: string | null;
  depositoId: string;
  depositoCodigo: string;
  depositoNome: string;
  enderecoId: string;
  enderecoMascarado: string;
  lote: string;
  numeroSerie: string;
  validade: Date | string | null;
  unidadeMedida: string;
  pesoLiquidoUnidade: string | null;
  saldoFisico: string;
  saldoBloqueado: string;
  saldoDebito: string;
  saldoReservado: string;
  updatedAt: Date | string;
}): DisponibilidadeEstoqueItem {
  const saldoFisico = toQuantityNumber(row.saldoFisico);
  const saldoReservado = toQuantityNumber(row.saldoReservado);
  const saldoDisponivel = Math.max(0, saldoFisico - saldoReservado);
  const pesoLiquidoTotalKg = calcularPesoLiquidoTotalKg(
    saldoFisico,
    row.pesoLiquidoUnidade,
  );
  const validade = toDate(row.validade);
  const updatedAt = toDate(row.updatedAt) ?? new Date();

  const vencimentoLimite = new Date();
  vencimentoLimite.setDate(vencimentoLimite.getDate() + VENCIMENTO_PROXIMO_DIAS);

  const vencimentoProximo =
    validade !== null &&
    validade <= vencimentoLimite &&
    validade >= new Date();

  return {
    produtoId: row.produtoId,
    produtoSku: row.produtoSku,
    produtoDescricao: row.produtoDescricao,
    produtoGrupo: row.produtoGrupo?.trim() || null,
    depositoId: row.depositoId,
    depositoCodigo: row.depositoCodigo,
    depositoNome: row.depositoNome,
    enderecoId: row.enderecoId,
    enderecoMascarado: row.enderecoMascarado,
    lote: row.lote,
    numeroSerie: row.numeroSerie,
    validade,
    unidadeMedida: row.unidadeMedida,
    saldoFisico,
    saldoBloqueado: toQuantityNumber(row.saldoBloqueado),
    saldoDebito: toQuantityNumber(row.saldoDebito),
    saldoReservado,
    saldoDisponivel,
    pesoLiquidoTotalKg,
    vencimentoProximo,
    updatedAt,
  };
}

function buildSummaryFromItems(
  items: DisponibilidadeEstoqueItem[],
): DisponibilidadeEstoqueSummary {
  return items.reduce<DisponibilidadeEstoqueSummary>(
    (acc, item) => ({
      saldoFisico: acc.saldoFisico + item.saldoFisico,
      saldoBloqueado: acc.saldoBloqueado + item.saldoBloqueado,
      saldoDebito: acc.saldoDebito + item.saldoDebito,
      saldoReservado: acc.saldoReservado + item.saldoReservado,
      saldoDisponivel: acc.saldoDisponivel + item.saldoDisponivel,
      pesoLiquidoTotalKg:
        acc.pesoLiquidoTotalKg + (item.pesoLiquidoTotalKg ?? 0),
    }),
    {
      saldoFisico: 0,
      saldoBloqueado: 0,
      saldoDebito: 0,
      saldoReservado: 0,
      saldoDisponivel: 0,
      pesoLiquidoTotalKg: 0,
    },
  );
}

export async function listDisponibilidadeEstoqueDb(
  db: DrizzleClient,
  filter: ListDisponibilidadeEstoqueFilter,
): Promise<ListDisponibilidadeEstoqueResult> {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  const saldoConditions = buildSaldoConditions(filter);

  const reservasAgg = db
    .select({
      produtoId: reservasEstoque.produtoId,
      depositoId: reservasEstoque.depositoId,
      enderecoId: reservasEstoque.enderecoId,
      loteReserva: sql<string>`coalesce(${reservasEstoque.lote}, '')`.as(
        'lote_reserva',
      ),
      numeroSerieReserva: sql<string>`coalesce(${reservasEstoque.numeroSerie}, '')`.as(
        'numero_serie_reserva',
      ),
      saldoReservado:
        sql<string>`coalesce(sum(${reservasEstoque.quantidade} - ${reservasEstoque.quantidadeAtendida}), 0)`.as(
          'saldo_reservado',
        ),
    })
    .from(reservasEstoque)
    .where(
      and(
        eq(reservasEstoque.unidadeId, filter.unidadeId),
        inArray(reservasEstoque.status, [...RESERVA_STATUS_ATIVOS]),
      ),
    )
    .groupBy(
      reservasEstoque.produtoId,
      reservasEstoque.depositoId,
      reservasEstoque.enderecoId,
      sql`coalesce(${reservasEstoque.lote}, '')`,
      sql`coalesce(${reservasEstoque.numeroSerie}, '')`,
    )
    .as('reservas_agg');

  const saldoAgg = db
    .select({
      produtoId: saldosEndereco.produtoId,
      depositoId: saldosEndereco.depositoId,
      enderecoId: saldosEndereco.enderecoId,
      lote: saldosEndereco.lote,
      numeroSerie: saldosEndereco.numeroSerie,
      validade: saldosEndereco.validade,
      unidadeMedida: saldosEndereco.unidadeMedida,
      saldoFisico:
        sql<string>`coalesce(sum(case when ${saldosEndereco.natureza} = 'fisico' and ${saldosEndereco.status} = 'liberado' then ${saldosEndereco.quantidade} else 0 end), 0)`.as(
          'saldo_fisico',
        ),
      saldoBloqueado:
        sql<string>`coalesce(sum(case when ${saldosEndereco.status} = 'bloqueado' then ${saldosEndereco.quantidade} else 0 end), 0)`.as(
          'saldo_bloqueado',
        ),
      saldoDebito:
        sql<string>`coalesce(sum(case when ${saldosEndereco.natureza} = 'debito' then ${saldosEndereco.quantidade} else 0 end), 0)`.as(
          'saldo_debito',
        ),
      updatedAt: sql<Date>`max(${saldosEndereco.updatedAt})`.as('saldo_updated_at'),
    })
    .from(saldosEndereco)
    .where(and(...saldoConditions))
    .groupBy(
      saldosEndereco.produtoId,
      saldosEndereco.depositoId,
      saldosEndereco.enderecoId,
      saldosEndereco.lote,
      saldosEndereco.numeroSerie,
      saldosEndereco.validade,
      saldosEndereco.unidadeMedida,
    )
    .as('saldo_agg');

  const searchCondition = buildSearchCondition(filter.search, {
    produtoId: saldoAgg.produtoId,
    lote: saldoAgg.lote,
  });

  const joinConditions: SQL[] = [];
  if (searchCondition) {
    joinConditions.push(searchCondition);
  }

  if (filter.grupos && filter.grupos.length > 0) {
    joinConditions.push(inArray(produtos.grupo, filter.grupos));
  }

  const whereClause =
    joinConditions.length > 0 ? and(...joinConditions) : undefined;

  const baseSelect = {
    produtoId: saldoAgg.produtoId,
    produtoSku: produtos.sku,
    produtoDescricao: produtos.descricao,
    produtoGrupo: produtos.grupo,
    pesoLiquidoUnidade: produtos.pesoLiquidoUnidade,
    depositoId: saldoAgg.depositoId,
    depositoCodigo: depositos.codigo,
    depositoNome: depositos.nome,
    enderecoId: saldoAgg.enderecoId,
    enderecoMascarado: enderecos.enderecoMascarado,
    lote: saldoAgg.lote,
    numeroSerie: saldoAgg.numeroSerie,
    validade: saldoAgg.validade,
    unidadeMedida: saldoAgg.unidadeMedida,
    saldoFisico: sql<string>`saldo_agg.saldo_fisico`,
    saldoBloqueado: sql<string>`saldo_agg.saldo_bloqueado`,
    saldoDebito: sql<string>`saldo_agg.saldo_debito`,
    saldoReservado: sql<string>`coalesce(reservas_agg.saldo_reservado, 0)`,
    updatedAt: sql<Date>`saldo_agg.saldo_updated_at`,
  };

  const reservasJoinCondition = and(
    eq(saldoAgg.produtoId, reservasAgg.produtoId),
    eq(saldoAgg.depositoId, reservasAgg.depositoId),
    eq(saldoAgg.enderecoId, reservasAgg.enderecoId),
    sql`saldo_agg.lote = reservas_agg.lote_reserva`,
    sql`saldo_agg.numero_serie = reservas_agg.numero_serie_reserva`,
  );

  const rows = await db
    .select(baseSelect)
    .from(saldoAgg)
    .innerJoin(produtos, eq(saldoAgg.produtoId, produtos.produtoId))
    .innerJoin(depositos, eq(saldoAgg.depositoId, depositos.id))
    .innerJoin(enderecos, eq(saldoAgg.enderecoId, enderecos.id))
    .leftJoin(reservasAgg, reservasJoinCondition)
    .where(whereClause)
    .orderBy(sql`saldo_agg.saldo_updated_at desc`)
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(saldoAgg)
    .innerJoin(produtos, eq(saldoAgg.produtoId, produtos.produtoId))
    .innerJoin(depositos, eq(saldoAgg.depositoId, depositos.id))
    .innerJoin(enderecos, eq(saldoAgg.enderecoId, enderecos.id))
    .where(whereClause);

  const summaryRows = await db
    .select(baseSelect)
    .from(saldoAgg)
    .innerJoin(produtos, eq(saldoAgg.produtoId, produtos.produtoId))
    .innerJoin(depositos, eq(saldoAgg.depositoId, depositos.id))
    .innerJoin(enderecos, eq(saldoAgg.enderecoId, enderecos.id))
    .leftJoin(reservasAgg, reservasJoinCondition)
    .where(whereClause);

  const items = rows.map(mapRowToItem);
  const summary = buildSummaryFromItems(summaryRows.map(mapRowToItem));

  return {
    items,
    total: countResult[0]?.count ?? 0,
    page,
    limit,
    summary,
  };
}
