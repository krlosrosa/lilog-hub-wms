import { and, eq } from 'drizzle-orm';

import type { CreateUnitizadorInput } from '../../../domain/model/armazenagem/armazenagem.model.js';
import type { UnitizadorRecord } from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { unitizadores } from '../providers/drizzle/config/migrations/schema.js';
import { mapUnitizadorRow } from './map-armazenagem.drizzle.js';

export async function criarUnitizadorDb(
  db: DrizzleClient,
  input: CreateUnitizadorInput,
): Promise<UnitizadorRecord> {
  const [record] = await db
    .insert(unitizadores)
    .values({
      unidadeId: input.unidadeId,
      codigo: input.codigo.trim().toUpperCase(),
      tipo: input.tipo,
      origem: input.origem,
      status: input.status,
      recebimentoId: input.recebimentoId,
      enderecoAtualId: input.enderecoAtualId,
    })
    .returning();

  if (!record) {
    throw new Error('Failed to insert unitizador');
  }

  return mapUnitizadorRow(record);
}

export async function findUnitizadorByCodigoDb(
  db: DrizzleClient,
  unidadeId: string,
  codigo: string,
): Promise<UnitizadorRecord | null> {
  const [row] = await db
    .select()
    .from(unitizadores)
    .where(
      and(
        eq(unitizadores.unidadeId, unidadeId),
        eq(unitizadores.codigo, codigo.trim().toUpperCase()),
      ),
    )
    .limit(1);

  return row ? mapUnitizadorRow(row) : null;
}

export async function findUnitizadorByIdDb(
  db: DrizzleClient,
  id: string,
): Promise<UnitizadorRecord | null> {
  const [row] = await db
    .select()
    .from(unitizadores)
    .where(eq(unitizadores.id, id))
    .limit(1);

  return row ? mapUnitizadorRow(row) : null;
}

export async function updateUnitizadorStatusDb(
  db: DrizzleClient,
  id: string,
  status: UnitizadorRecord['status'],
  extra?: { enderecoAtualId?: string; recebimentoId?: string },
): Promise<UnitizadorRecord | null> {
  const [record] = await db
    .update(unitizadores)
    .set({
      status,
      enderecoAtualId: extra?.enderecoAtualId,
      recebimentoId: extra?.recebimentoId,
      updatedAt: new Date(),
    })
    .where(eq(unitizadores.id, id))
    .returning();

  return record ? mapUnitizadorRow(record) : null;
}
