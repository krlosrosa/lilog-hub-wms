import { and, eq, inArray, sql } from 'drizzle-orm';

import type {
  ConsumirReservaInput,
  CriarReservaInput,
  LiberarReservaInput,
  ReservaEstoque,
} from '../../../domain/model/estoque/reserva-estoque.model.js';
import type {
  ListReservasAtivasFilter,
  SaldoDisponivelFilter,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  reservasEstoque,
  saldosEndereco,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  mapReservaEstoqueRow,
  normalizeLote,
  normalizeNumeroSerie,
  toQuantityNumber,
  toQuantityString,
} from './map-estoque.drizzle.js';

const RESERVA_STATUS_ATIVOS = ['ativa', 'parcial'] as const;

function buildReservaConditions(filter: ListReservasAtivasFilter) {
  const conditions = [
    eq(reservasEstoque.unidadeId, filter.unidadeId),
    inArray(reservasEstoque.status, [...RESERVA_STATUS_ATIVOS]),
  ];

  if (filter.produtoId) {
    conditions.push(eq(reservasEstoque.produtoId, filter.produtoId));
  }

  if (filter.depositoId) {
    conditions.push(eq(reservasEstoque.depositoId, filter.depositoId));
  }

  if (filter.enderecoId) {
    conditions.push(eq(reservasEstoque.enderecoId, filter.enderecoId));
  }

  if (filter.documentoRef) {
    conditions.push(eq(reservasEstoque.documentoRef, filter.documentoRef));
  }

  return conditions;
}

async function getSaldoFisicoTotalDb(
  db: DrizzleClient,
  filter: SaldoDisponivelFilter,
): Promise<number> {
  const lote = normalizeLote(filter.lote);
  const numeroSerie = normalizeNumeroSerie(filter.numeroSerie);

  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${saldosEndereco.quantidade}), 0)`,
    })
    .from(saldosEndereco)
    .where(
      and(
        eq(saldosEndereco.unidadeId, filter.unidadeId),
        eq(saldosEndereco.produtoId, filter.produtoId),
        eq(saldosEndereco.depositoId, filter.depositoId),
        eq(saldosEndereco.lote, lote),
        eq(saldosEndereco.numeroSerie, numeroSerie),
        eq(saldosEndereco.natureza, 'fisico'),
        eq(saldosEndereco.status, 'liberado'),
      ),
    );

  return toQuantityNumber(row?.total ?? '0');
}

async function getReservasPendentesTotalDb(
  db: DrizzleClient,
  filter: SaldoDisponivelFilter,
): Promise<number> {
  const lote = normalizeLote(filter.lote);
  const numeroSerie = normalizeNumeroSerie(filter.numeroSerie);

  const conditions = [
    eq(reservasEstoque.unidadeId, filter.unidadeId),
    eq(reservasEstoque.produtoId, filter.produtoId),
    eq(reservasEstoque.depositoId, filter.depositoId),
    inArray(reservasEstoque.status, [...RESERVA_STATUS_ATIVOS]),
  ];

  if (lote) {
    conditions.push(eq(reservasEstoque.lote, lote));
  }

  if (numeroSerie) {
    conditions.push(eq(reservasEstoque.numeroSerie, numeroSerie));
  }

  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${reservasEstoque.quantidade} - ${reservasEstoque.quantidadeAtendida}), 0)`,
    })
    .from(reservasEstoque)
    .where(and(...conditions));

  return toQuantityNumber(row?.total ?? '0');
}

export async function getSaldoDisponivelDb(
  db: DrizzleClient,
  filter: SaldoDisponivelFilter,
): Promise<number> {
  const [fisico, reservado] = await Promise.all([
    getSaldoFisicoTotalDb(db, filter),
    getReservasPendentesTotalDb(db, filter),
  ]);

  return Math.max(0, fisico - reservado);
}

export async function listReservasAtivasDb(
  db: DrizzleClient,
  filter: ListReservasAtivasFilter,
): Promise<ReservaEstoque[]> {
  const rows = await db
    .select()
    .from(reservasEstoque)
    .where(and(...buildReservaConditions(filter)));

  return rows.map(mapReservaEstoqueRow);
}

export async function criarReservaDb(
  db: DrizzleClient,
  input: CriarReservaInput,
): Promise<ReservaEstoque> {
  const lote = input.lote ? normalizeLote(input.lote) : null;
  const numeroSerie = input.numeroSerie
    ? normalizeNumeroSerie(input.numeroSerie)
    : null;

  const disponivel = await getSaldoDisponivelDb(db, {
    unidadeId: input.unidadeId,
    produtoId: input.produtoId,
    depositoId: input.depositoId,
    lote: lote ?? undefined,
    numeroSerie: numeroSerie ?? undefined,
  });

  if (input.quantidade > disponivel) {
    throw new Error('Quantidade solicitada excede o saldo disponível');
  }

  const [row] = await db
    .insert(reservasEstoque)
    .values({
      unidadeId: input.unidadeId,
      produtoId: input.produtoId,
      depositoId: input.depositoId,
      enderecoId: input.enderecoId ?? null,
      lote,
      numeroSerie,
      quantidade: toQuantityString(input.quantidade),
      quantidadeAtendida: '0.0000',
      status: 'ativa',
      origem: input.origem,
      documentoRef: input.documentoRef,
      motivo: input.motivo ?? null,
      operatorId: input.operatorId ?? null,
      expiresAt: input.expiresAt ?? null,
    })
    .returning();

  if (!row) {
    throw new Error('Falha ao criar reserva de estoque');
  }

  return mapReservaEstoqueRow(row);
}

export async function liberarReservaDb(
  db: DrizzleClient,
  input: LiberarReservaInput,
): Promise<ReservaEstoque> {
  const [existing] = await db
    .select()
    .from(reservasEstoque)
    .where(eq(reservasEstoque.id, input.reservaId))
    .limit(1);

  if (!existing) {
    throw new Error('Reserva não encontrada');
  }

  if (
    existing.status !== 'ativa' &&
    existing.status !== 'parcial'
  ) {
    throw new Error('Reserva não está ativa para liberação');
  }

  const [row] = await db
    .update(reservasEstoque)
    .set({
      status: 'cancelada',
      motivo: input.motivo ?? existing.motivo,
      operatorId: input.operatorId ?? existing.operatorId,
      updatedAt: new Date(),
    })
    .where(eq(reservasEstoque.id, input.reservaId))
    .returning();

  if (!row) {
    throw new Error('Falha ao liberar reserva de estoque');
  }

  return mapReservaEstoqueRow(row);
}

export async function consumirReservaDb(
  db: DrizzleClient,
  input: ConsumirReservaInput,
): Promise<ReservaEstoque> {
  const [existing] = await db
    .select()
    .from(reservasEstoque)
    .where(eq(reservasEstoque.id, input.reservaId))
    .limit(1);

  if (!existing) {
    throw new Error('Reserva não encontrada');
  }

  if (
    existing.status !== 'ativa' &&
    existing.status !== 'parcial'
  ) {
    throw new Error('Reserva não está ativa para consumo');
  }

  const quantidadeTotal = toQuantityNumber(existing.quantidade);
  const quantidadeAtendidaAtual = toQuantityNumber(existing.quantidadeAtendida);
  const pendente = quantidadeTotal - quantidadeAtendidaAtual;

  if (input.quantidade > pendente) {
    throw new Error('Quantidade de consumo excede o pendente da reserva');
  }

  const novaAtendida = quantidadeAtendidaAtual + input.quantidade;
  const novoStatus = novaAtendida >= quantidadeTotal ? 'atendida' : 'parcial';

  const [row] = await db
    .update(reservasEstoque)
    .set({
      quantidadeAtendida: toQuantityString(novaAtendida),
      status: novoStatus,
      operatorId: input.operatorId ?? existing.operatorId,
      updatedAt: new Date(),
    })
    .where(eq(reservasEstoque.id, input.reservaId))
    .returning();

  if (!row) {
    throw new Error('Falha ao consumir reserva de estoque');
  }

  return mapReservaEstoqueRow(row);
}
