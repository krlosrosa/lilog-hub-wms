import { and, eq } from 'drizzle-orm';

import type { ListSaldosFilter } from '../../../domain/repositories/estoque/estoque.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { depositos, saldos } from '../providers/drizzle/config/migrations/schema.js';
import { mapSaldoRow } from './map-estoque.drizzle.js';

export async function listSaldosDb(db: DrizzleClient, filter: ListSaldosFilter) {
  const conditions = [eq(saldos.unidadeId, filter.unidadeId)];

  if (filter.produtoId) {
    conditions.push(eq(saldos.produtoId, filter.produtoId));
  }

  const rows = await db
    .select({
      saldo: saldos,
      deposito: depositos,
    })
    .from(saldos)
    .innerJoin(depositos, eq(saldos.depositoId, depositos.id))
    .where(and(...conditions));

  const filtered = filter.depositoCodigo
    ? rows.filter((row) => row.deposito.codigo === filter.depositoCodigo)
    : rows;

  return filtered.map((row) => mapSaldoRow(row.saldo, row.deposito));
}

export async function listSaldosByDepositoIdDb(
  db: DrizzleClient,
  depositoId: string,
) {
  const rows = await db
    .select({
      saldo: saldos,
      deposito: depositos,
    })
    .from(saldos)
    .innerJoin(depositos, eq(saldos.depositoId, depositos.id))
    .where(eq(saldos.depositoId, depositoId));

  return rows.map((row) => mapSaldoRow(row.saldo, row.deposito));
}
