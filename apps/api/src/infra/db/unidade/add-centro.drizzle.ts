import type { AddCentroInput } from '../../../domain/repositories/unidade/unidade.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { centros } from '../providers/drizzle/config/migrations/schema.js';
import { mapCentroRow } from './map-unidade.drizzle.js';

export async function addCentroDb(db: DrizzleClient, data: AddCentroInput) {
  const [record] = await db
    .insert(centros)
    .values({
      unidadeId: data.unidadeId,
      centro: data.centro,
      empresa: data.empresa,
      nome: data.nome,
    })
    .returning();

  if (!record) {
    throw new Error('Failed to add centro');
  }

  return mapCentroRow(record);
}
