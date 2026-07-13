import { eq } from 'drizzle-orm';

import type { CreateImpedimentoInput } from '../../../domain/repositories/recebimento/impedimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { impedimentosRecebimento } from '../providers/drizzle/config/migrations/schema.js';

function mapRow(row: typeof impedimentosRecebimento.$inferSelect) {
  return {
    id: row.id,
    preRecebimentoId: row.preRecebimentoId,
    tipo: row.tipo,
    descricao: row.descricao,
    photoCount: row.photoCount,
    registradoPorId: row.registradoPorId,
    registradoEm: row.registradoEm,
    createdAt: row.createdAt,
  };
}

export async function registrarImpedimentoDb(
  db: DrizzleClient,
  data: CreateImpedimentoInput,
) {
  const [row] = await db
    .insert(impedimentosRecebimento)
    .values({
      preRecebimentoId: data.preRecebimentoId,
      tipo: data.tipo,
      descricao: data.descricao,
      photoCount: data.photoCount,
      registradoPorId: data.registradoPorId ?? null,
    })
    .returning();

  if (!row) {
    throw new Error('Falha ao registrar impedimento');
  }

  return mapRow(row);
}

export async function findImpedimentoByPreRecebimentoIdDb(
  db: DrizzleClient,
  preRecebimentoId: string,
) {
  const [row] = await db
    .select()
    .from(impedimentosRecebimento)
    .where(eq(impedimentosRecebimento.preRecebimentoId, preRecebimentoId))
    .limit(1);

  return row ? mapRow(row) : null;
}
