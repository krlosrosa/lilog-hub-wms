import type { AddCncEventoInput } from '../../../domain/repositories/cnc/cnc.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { cncEventos } from '../providers/drizzle/config/migrations/schema.js';
import { mapCncEventoRow, toCncEventoInsertValues } from './map-cnc.drizzle.js';

export async function addCncEventoDb(
  db: DrizzleClient,
  data: AddCncEventoInput,
) {
  const [row] = await db
    .insert(cncEventos)
    .values(toCncEventoInsertValues(data))
    .returning();

  if (!row) {
    throw new Error('Failed to create CNC event');
  }

  return mapCncEventoRow(row);
}
