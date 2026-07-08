import { alias } from 'drizzle-orm/pg-core';
import { and, count, desc, eq, or, type SQL } from 'drizzle-orm';

import type {
  HistoricoMovimentacaoItem,
  ListHistoricoProdutoFilter,
  ListHistoricoProdutoResult,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  depositos,
  enderecos,
  movimentacoesEstoque,
  users,
} from '../providers/drizzle/config/migrations/schema.js';
import { normalizeLote, toQuantityNumber } from './map-estoque.drizzle.js';

const depositoOrigem = alias(depositos, 'deposito_origem');
const depositoDestino = alias(depositos, 'deposito_destino');
const enderecoOrigem = alias(enderecos, 'endereco_origem');
const enderecoDestino = alias(enderecos, 'endereco_destino');
const operador = alias(users, 'operador');

function buildConditions(filter: ListHistoricoProdutoFilter): SQL[] {
  const conditions: SQL[] = [
    eq(movimentacoesEstoque.unidadeId, filter.unidadeId),
    eq(movimentacoesEstoque.produtoId, filter.produtoId),
  ];

  if (filter.lote?.trim()) {
    conditions.push(eq(movimentacoesEstoque.lote, normalizeLote(filter.lote)));
  }

  if (filter.depositoId) {
    conditions.push(
      or(
        eq(movimentacoesEstoque.depositoOrigemId, filter.depositoId),
        eq(movimentacoesEstoque.depositoDestinoId, filter.depositoId),
      )!,
    );
  }

  if (filter.enderecoId) {
    conditions.push(
      or(
        eq(movimentacoesEstoque.enderecoOrigemId, filter.enderecoId),
        eq(movimentacoesEstoque.enderecoDestinoId, filter.enderecoId),
      )!,
    );
  }

  return conditions;
}

function mapRow(row: {
  id: string;
  tipoMovimento: HistoricoMovimentacaoItem['tipoMovimento'];
  quantidade: string;
  unidadeMedida: string;
  lote: string | null;
  validade: Date | null;
  numeroSerie: string | null;
  natureza: HistoricoMovimentacaoItem['natureza'];
  documentoRef: string | null;
  motivo: string;
  operatorId: number | null;
  operatorNome: string | null;
  occurredAt: Date;
  depositoOrigemId: string | null;
  depositoOrigemCodigo: string | null;
  depositoOrigemNome: string | null;
  depositoDestinoId: string | null;
  depositoDestinoCodigo: string | null;
  depositoDestinoNome: string | null;
  enderecoOrigemId: string | null;
  enderecoOrigemMascarado: string | null;
  enderecoDestinoId: string | null;
  enderecoDestinoMascarado: string | null;
}): HistoricoMovimentacaoItem {
  return {
    id: row.id,
    tipoMovimento: row.tipoMovimento,
    quantidade: toQuantityNumber(row.quantidade),
    unidadeMedida: row.unidadeMedida,
    lote: row.lote ?? '',
    validade: row.validade,
    numeroSerie: row.numeroSerie ?? '',
    natureza: row.natureza,
    documentoRef: row.documentoRef,
    motivo: row.motivo,
    operatorId: row.operatorId,
    operatorNome: row.operatorNome,
    occurredAt: row.occurredAt,
    depositoOrigemId: row.depositoOrigemId,
    depositoOrigemCodigo: row.depositoOrigemCodigo,
    depositoOrigemNome: row.depositoOrigemNome,
    depositoDestinoId: row.depositoDestinoId,
    depositoDestinoCodigo: row.depositoDestinoCodigo,
    depositoDestinoNome: row.depositoDestinoNome,
    enderecoOrigemId: row.enderecoOrigemId,
    enderecoOrigemMascarado: row.enderecoOrigemMascarado,
    enderecoDestinoId: row.enderecoDestinoId,
    enderecoDestinoMascarado: row.enderecoDestinoMascarado,
  };
}

export async function listHistoricoProdutoDb(
  db: DrizzleClient,
  filter: ListHistoricoProdutoFilter,
): Promise<ListHistoricoProdutoResult> {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;
  const conditions = buildConditions(filter);
  const whereClause = and(...conditions);

  const [countRow] = await db
    .select({ total: count() })
    .from(movimentacoesEstoque)
    .where(whereClause);

  const rows = await db
    .select({
      id: movimentacoesEstoque.id,
      tipoMovimento: movimentacoesEstoque.tipoMovimento,
      quantidade: movimentacoesEstoque.quantidade,
      unidadeMedida: movimentacoesEstoque.unidadeMedida,
      lote: movimentacoesEstoque.lote,
      validade: movimentacoesEstoque.validade,
      numeroSerie: movimentacoesEstoque.numeroSerie,
      natureza: movimentacoesEstoque.natureza,
      documentoRef: movimentacoesEstoque.documentoRef,
      motivo: movimentacoesEstoque.motivo,
      operatorId: movimentacoesEstoque.operatorId,
      operatorNome: operador.name,
      occurredAt: movimentacoesEstoque.occurredAt,
      depositoOrigemId: movimentacoesEstoque.depositoOrigemId,
      depositoOrigemCodigo: depositoOrigem.codigo,
      depositoOrigemNome: depositoOrigem.nome,
      depositoDestinoId: movimentacoesEstoque.depositoDestinoId,
      depositoDestinoCodigo: depositoDestino.codigo,
      depositoDestinoNome: depositoDestino.nome,
      enderecoOrigemId: movimentacoesEstoque.enderecoOrigemId,
      enderecoOrigemMascarado: enderecoOrigem.enderecoMascarado,
      enderecoDestinoId: movimentacoesEstoque.enderecoDestinoId,
      enderecoDestinoMascarado: enderecoDestino.enderecoMascarado,
    })
    .from(movimentacoesEstoque)
    .leftJoin(
      depositoOrigem,
      eq(movimentacoesEstoque.depositoOrigemId, depositoOrigem.id),
    )
    .leftJoin(
      depositoDestino,
      eq(movimentacoesEstoque.depositoDestinoId, depositoDestino.id),
    )
    .leftJoin(
      enderecoOrigem,
      eq(movimentacoesEstoque.enderecoOrigemId, enderecoOrigem.id),
    )
    .leftJoin(
      enderecoDestino,
      eq(movimentacoesEstoque.enderecoDestinoId, enderecoDestino.id),
    )
    .leftJoin(operador, eq(movimentacoesEstoque.operatorId, operador.id))
    .where(whereClause)
    .orderBy(desc(movimentacoesEstoque.occurredAt))
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map(mapRow),
    total: Number(countRow?.total ?? 0),
    page,
    limit,
  };
}
