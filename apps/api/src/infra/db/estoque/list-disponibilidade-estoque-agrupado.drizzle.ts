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
  DisponibilidadeEstoqueAgrupadoItem,
  DisponibilidadeEstoqueSummary,
  ListDisponibilidadeEstoqueAgrupadoFilter,
  ListDisponibilidadeEstoqueAgrupadoResult,
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

function buildSaldoConditions(
  filter: ListDisponibilidadeEstoqueAgrupadoFilter,
): SQL[] {
  const conditions: SQL[] = [eq(saldosEndereco.unidadeId, filter.unidadeId)];

  if (filter.produtoId) {
    conditions.push(eq(saldosEndereco.produtoId, filter.produtoId));
  }

  if (filter.depositoId) {
    conditions.push(eq(saldosEndereco.depositoId, filter.depositoId));
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

function mapRowToItem(
  row: {
    produtoId: string;
    produtoSku: string;
    produtoDescricao: string;
    produtoGrupo: string | null;
    lote: string;
    totalLotes?: number;
    unidadeMedida: string;
    posicoes: number;
    validadeMaisProxima: Date | string | null;
    pesoLiquidoUnidade: string | null;
    saldoFisico: string;
    saldoBloqueado: string;
    saldoDebito: string;
    saldoReservado: string;
    updatedAt: Date | string;
  },
  groupBy: 'produto' | 'lote',
): DisponibilidadeEstoqueAgrupadoItem {
  const saldoFisico = toQuantityNumber(row.saldoFisico);
  const saldoReservado = toQuantityNumber(row.saldoReservado);
  const saldoDisponivel = Math.max(0, saldoFisico - saldoReservado);
  const pesoLiquidoTotalKg = calcularPesoLiquidoTotalKg(
    saldoFisico,
    row.pesoLiquidoUnidade,
  );
  const validadeMaisProxima = toDate(row.validadeMaisProxima);
  const updatedAt = toDate(row.updatedAt) ?? new Date();

  const vencimentoLimite = new Date();
  vencimentoLimite.setDate(vencimentoLimite.getDate() + VENCIMENTO_PROXIMO_DIAS);

  const vencimentoProximo =
    validadeMaisProxima !== null &&
    validadeMaisProxima <= vencimentoLimite &&
    validadeMaisProxima >= new Date();

  return {
    produtoId: row.produtoId,
    produtoSku: row.produtoSku,
    produtoDescricao: row.produtoDescricao,
    produtoGrupo: row.produtoGrupo?.trim() || null,
    lote: groupBy === 'produto' ? '' : row.lote,
    totalLotes:
      groupBy === 'produto' ? Number(row.totalLotes ?? 0) : undefined,
    unidadeMedida: row.unidadeMedida,
    posicoes: Number(row.posicoes),
    validadeMaisProxima,
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
  items: DisponibilidadeEstoqueAgrupadoItem[],
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

export async function listDisponibilidadeEstoqueAgrupadoDb(
  db: DrizzleClient,
  filter: ListDisponibilidadeEstoqueAgrupadoFilter,
): Promise<ListDisponibilidadeEstoqueAgrupadoResult> {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;
  const groupBy: 'produto' | 'lote' = filter.lote?.trim()
    ? 'lote'
    : (filter.groupBy ?? 'lote');

  const saldoConditions = buildSaldoConditions(filter);

  const innerSearchCondition = buildSearchCondition(filter.search, {
    produtoId: saldosEndereco.produtoId,
    lote: saldosEndereco.lote,
  });

  const innerWhereParts = [...saldoConditions];
  if (innerSearchCondition) {
    innerWhereParts.push(innerSearchCondition);
  }
  if (filter.grupos && filter.grupos.length > 0) {
    innerWhereParts.push(inArray(produtos.grupo, filter.grupos));
  }

  const reservasAgg =
    groupBy === 'produto'
      ? db
          .select({
            produtoId: reservasEstoque.produtoId,
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
              filter.depositoId
                ? eq(reservasEstoque.depositoId, filter.depositoId)
                : undefined,
            ),
          )
          .groupBy(reservasEstoque.produtoId)
          .as('reservas_agg')
      : db
          .select({
            produtoId: reservasEstoque.produtoId,
            loteReserva: sql<string>`coalesce(${reservasEstoque.lote}, '')`.as(
              'lote_reserva',
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
              filter.depositoId
                ? eq(reservasEstoque.depositoId, filter.depositoId)
                : undefined,
            ),
          )
          .groupBy(
            reservasEstoque.produtoId,
            sql`coalesce(${reservasEstoque.lote}, '')`,
          )
          .as('reservas_agg');

  const saldoAgg =
    groupBy === 'produto'
      ? db
          .select({
            produtoId: saldosEndereco.produtoId,
            lote: sql<string>`''`.as('lote'),
            totalLotes:
              sql<number>`count(distinct ${saldosEndereco.lote})::int`.as(
                'total_lotes',
              ),
            unidadeMedida: sql<string>`max(${saldosEndereco.unidadeMedida})`.as(
              'unidade_medida',
            ),
            posicoes:
              sql<number>`count(distinct (${saldosEndereco.depositoId}, ${saldosEndereco.enderecoId}))::int`.as(
                'posicoes',
              ),
            validadeMaisProxima: sql<Date | null>`min(${saldosEndereco.validade})`.as(
              'validade_mais_proxima',
            ),
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
            updatedAt: sql<Date>`max(${saldosEndereco.updatedAt})`.as(
              'saldo_updated_at',
            ),
          })
          .from(saldosEndereco)
          .innerJoin(produtos, eq(saldosEndereco.produtoId, produtos.produtoId))
          .innerJoin(depositos, eq(saldosEndereco.depositoId, depositos.id))
          .innerJoin(enderecos, eq(saldosEndereco.enderecoId, enderecos.id))
          .where(and(...innerWhereParts))
          .groupBy(saldosEndereco.produtoId)
          .as('saldo_agg')
      : db
          .select({
            produtoId: saldosEndereco.produtoId,
            lote: saldosEndereco.lote,
            unidadeMedida: saldosEndereco.unidadeMedida,
            posicoes:
              sql<number>`count(distinct (${saldosEndereco.depositoId}, ${saldosEndereco.enderecoId}))::int`.as(
                'posicoes',
              ),
            validadeMaisProxima: sql<Date | null>`min(${saldosEndereco.validade})`.as(
              'validade_mais_proxima',
            ),
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
          .innerJoin(produtos, eq(saldosEndereco.produtoId, produtos.produtoId))
          .innerJoin(depositos, eq(saldosEndereco.depositoId, depositos.id))
          .innerJoin(enderecos, eq(saldosEndereco.enderecoId, enderecos.id))
          .where(and(...innerWhereParts))
          .groupBy(
            saldosEndereco.produtoId,
            saldosEndereco.lote,
            saldosEndereco.unidadeMedida,
          )
          .as('saldo_agg');

  const baseSelect = {
    produtoId: saldoAgg.produtoId,
    produtoSku: produtos.sku,
    produtoDescricao: produtos.descricao,
    produtoGrupo: produtos.grupo,
    pesoLiquidoUnidade: produtos.pesoLiquidoUnidade,
    lote:
      groupBy === 'produto'
        ? sql<string>`saldo_agg.lote`
        : saldoAgg.lote,
    totalLotes:
      groupBy === 'produto'
        ? sql<number>`saldo_agg.total_lotes`
        : sql<number>`0`,
    unidadeMedida:
      groupBy === 'produto'
        ? sql<string>`saldo_agg.unidade_medida`
        : saldoAgg.unidadeMedida,
    posicoes: sql<number>`saldo_agg.posicoes`,
    validadeMaisProxima: sql<Date | null>`saldo_agg.validade_mais_proxima`,
    saldoFisico: sql<string>`saldo_agg.saldo_fisico`,
    saldoBloqueado: sql<string>`saldo_agg.saldo_bloqueado`,
    saldoDebito: sql<string>`saldo_agg.saldo_debito`,
    saldoReservado: sql<string>`coalesce(reservas_agg.saldo_reservado, 0)`,
    updatedAt: sql<Date>`saldo_agg.saldo_updated_at`,
  };

  const reservasJoinCondition =
    groupBy === 'produto'
      ? eq(saldoAgg.produtoId, reservasAgg.produtoId)
      : and(
          eq(saldoAgg.produtoId, reservasAgg.produtoId),
          sql`saldo_agg.lote = reservas_agg.lote_reserva`,
        );

  const rows = await db
    .select(baseSelect)
    .from(saldoAgg)
    .innerJoin(produtos, eq(saldoAgg.produtoId, produtos.produtoId))
    .leftJoin(reservasAgg, reservasJoinCondition)
    .orderBy(sql`saldo_agg.saldo_updated_at desc`)
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(saldoAgg)
    .innerJoin(produtos, eq(saldoAgg.produtoId, produtos.produtoId));

  const summaryRows = await db
    .select(baseSelect)
    .from(saldoAgg)
    .innerJoin(produtos, eq(saldoAgg.produtoId, produtos.produtoId))
    .leftJoin(reservasAgg, reservasJoinCondition);

  const items = rows.map((row) => mapRowToItem(row, groupBy));
  const summary = buildSummaryFromItems(summaryRows.map((row) => mapRowToItem(row, groupBy)));

  return {
    items,
    total: countResult[0]?.count ?? 0,
    page,
    limit,
    summary,
  };
}
