import type { CreateDivergenciaInput } from '../../../domain/repositories/recebimento/recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { divergenciasRecebimento } from '../providers/drizzle/config/migrations/schema.js';
import {
  mapDivergenciaRow,
  toDivergenciaInsertValues,
} from './map-recebimento.drizzle.js';

export async function createDivergenciaDb(
  db: DrizzleClient,
  data: CreateDivergenciaInput,
) {
  const [record] = await db
    .insert(divergenciasRecebimento)
    .values(toDivergenciaInsertValues(data))
    .returning();

  if (!record) {
    throw new Error('Failed to create divergencia');
  }

  return mapDivergenciaRow(record);
}
