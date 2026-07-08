import type { CreateCncTratativaInput } from '../../../domain/repositories/cnc/cnc.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { cncTratativas } from '../providers/drizzle/config/migrations/schema.js';
import {
  mapCncTratativaRow,
  toCncTratativaInsertValues,
} from './map-cnc.drizzle.js';

export async function createCncTratativaDb(
  db: DrizzleClient,
  data: CreateCncTratativaInput,
) {
  const [row] = await db
    .insert(cncTratativas)
    .values(toCncTratativaInsertValues(data))
    .returning();

  if (!row) {
    throw new Error('Failed to create CNC tratativa');
  }

  return mapCncTratativaRow(row);
}
