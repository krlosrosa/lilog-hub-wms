import type { CreateCentroOrigemInput } from '../../../domain/model/centro-origem/centro-origem.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { centrosOrigem } from '../providers/drizzle/config/migrations/schema.js';
import { findCentroOrigemByIdDb } from './find-centro-origem-by-id.drizzle.js';

export async function createCentroOrigemDb(
  db: DrizzleClient,
  data: CreateCentroOrigemInput,
) {
  const [record] = await db
    .insert(centrosOrigem)
    .values({
      centro: data.centro.trim(),
      nome: data.nome.trim(),
    })
    .returning();

  if (!record) {
    throw new Error('Failed to create centro de origem');
  }

  const created = await findCentroOrigemByIdDb(db, record.centro);

  if (!created) {
    throw new Error('Failed to load created centro de origem');
  }

  return created;
}
