import { and, eq, sql } from 'drizzle-orm';

import type {
  CreateMotivoBloqueioSaldoInput,
  MotivoBloqueioSaldo,
  UpdateMotivoBloqueioSaldoInput,
} from '../../../domain/model/estoque/motivo-bloqueio-saldo.model.js';
import { SYSTEM_MOTIVOS_BLOQUEIO_SALDO } from '../../../domain/model/estoque/motivo-bloqueio-saldo.model.js';
import type { ListMotivosBloqueioSaldoFilter } from '../../../domain/repositories/estoque/motivo-bloqueio-saldo.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { motivosBloqueioSaldo } from '../providers/drizzle/config/migrations/schema.js';

function mapMotivoBloqueioSaldoRow(
  row: typeof motivosBloqueioSaldo.$inferSelect,
): MotivoBloqueioSaldo {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    codigo: row.codigo,
    nome: row.nome,
    descricao: row.descricao,
    origem: row.origem,
    ativo: row.ativo,
    sistema: row.sistema,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createMotivoBloqueioSaldoDb(
  db: DrizzleClient,
  input: CreateMotivoBloqueioSaldoInput,
): Promise<MotivoBloqueioSaldo> {
  const [created] = await db
    .insert(motivosBloqueioSaldo)
    .values({
      unidadeId: input.unidadeId,
      codigo: input.codigo.trim().toUpperCase(),
      nome: input.nome.trim(),
      descricao: input.descricao?.trim() ?? null,
      origem: input.origem ?? 'manual',
      sistema: false,
      ativo: true,
    })
    .returning();

  if (!created) {
    throw new Error('Falha ao criar motivo de bloqueio');
  }

  return mapMotivoBloqueioSaldoRow(created);
}

export async function listMotivosBloqueioSaldoDb(
  db: DrizzleClient,
  filter: ListMotivosBloqueioSaldoFilter,
): Promise<MotivoBloqueioSaldo[]> {
  const conditions = [eq(motivosBloqueioSaldo.unidadeId, filter.unidadeId)];

  if (filter.ativo !== undefined) {
    conditions.push(eq(motivosBloqueioSaldo.ativo, filter.ativo));
  }

  if (filter.origem) {
    conditions.push(eq(motivosBloqueioSaldo.origem, filter.origem));
  }

  const rows = await db
    .select()
    .from(motivosBloqueioSaldo)
    .where(and(...conditions))
    .orderBy(motivosBloqueioSaldo.codigo);

  return rows.map(mapMotivoBloqueioSaldoRow);
}

export async function findMotivoBloqueioSaldoByIdDb(
  db: DrizzleClient,
  id: string,
): Promise<MotivoBloqueioSaldo | null> {
  const [row] = await db
    .select()
    .from(motivosBloqueioSaldo)
    .where(eq(motivosBloqueioSaldo.id, id))
    .limit(1);

  return row ? mapMotivoBloqueioSaldoRow(row) : null;
}

export async function findMotivoBloqueioSaldoByCodigoDb(
  db: DrizzleClient,
  unidadeId: string,
  codigo: string,
): Promise<MotivoBloqueioSaldo | null> {
  const [row] = await db
    .select()
    .from(motivosBloqueioSaldo)
    .where(
      and(
        eq(motivosBloqueioSaldo.unidadeId, unidadeId),
        eq(motivosBloqueioSaldo.codigo, codigo.trim().toUpperCase()),
      ),
    )
    .limit(1);

  return row ? mapMotivoBloqueioSaldoRow(row) : null;
}

export async function updateMotivoBloqueioSaldoDb(
  db: DrizzleClient,
  id: string,
  input: UpdateMotivoBloqueioSaldoInput,
): Promise<MotivoBloqueioSaldo | null> {
  const [updated] = await db
    .update(motivosBloqueioSaldo)
    .set({
      ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
      ...(input.descricao !== undefined
        ? { descricao: input.descricao?.trim() ?? null }
        : {}),
      ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
      updatedAt: sql`now()`,
    })
    .where(eq(motivosBloqueioSaldo.id, id))
    .returning();

  return updated ? mapMotivoBloqueioSaldoRow(updated) : null;
}

export async function deleteMotivoBloqueioSaldoDb(
  db: DrizzleClient,
  id: string,
): Promise<void> {
  await db.delete(motivosBloqueioSaldo).where(eq(motivosBloqueioSaldo.id, id));
}

export async function ensureMotivosBloqueioSistemaUnidadeDb(
  db: DrizzleClient,
  unidadeId: string,
): Promise<MotivoBloqueioSaldo[]> {
  const existing = await db
    .select()
    .from(motivosBloqueioSaldo)
    .where(eq(motivosBloqueioSaldo.unidadeId, unidadeId));

  const existingCodes = new Set(existing.map((row) => row.codigo));
  const missing = SYSTEM_MOTIVOS_BLOQUEIO_SALDO.filter(
    (item) => !existingCodes.has(item.codigo),
  );

  if (missing.length > 0) {
    await db.insert(motivosBloqueioSaldo).values(
      missing.map((item) => ({
        unidadeId,
        codigo: item.codigo,
        nome: item.nome,
        descricao: item.descricao,
        origem: item.origem,
        sistema: true,
        ativo: true,
      })),
    );
  }

  const rows = await db
    .select()
    .from(motivosBloqueioSaldo)
    .where(eq(motivosBloqueioSaldo.unidadeId, unidadeId));

  return rows.map(mapMotivoBloqueioSaldoRow);
}
