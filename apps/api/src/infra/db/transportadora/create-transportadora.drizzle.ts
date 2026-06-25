import type { CreateTransportadoraInput } from '../../../domain/model/transportadora/transportadora.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportadoras } from '../providers/drizzle/config/migrations/schema.js';
import { findTransportadoraByIdDb } from './find-transportadora.drizzle.js';
import { toTransportadoraInsertValues } from './map-transportadora.drizzle.js';

export async function createTransportadoraDb(
  db: DrizzleClient,
  data: CreateTransportadoraInput,
) {
  const [record] = await db
    .insert(transportadoras)
    .values(toTransportadoraInsertValues(data))
    .returning();

  if (!record) {
    throw new Error('Failed to create transportadora');
  }

  const created = await findTransportadoraByIdDb(db, record.id);

  if (!created) {
    throw new Error('Failed to load created transportadora');
  }

  return created;
}
