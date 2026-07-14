import { eq } from 'drizzle-orm';

import type { UpdateCentroOrigemInput } from '../../../domain/model/centro-origem/centro-origem.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { centrosOrigem } from '../providers/drizzle/config/migrations/schema.js';
import { findCentroOrigemByIdDb } from './find-centro-origem-by-id.drizzle.js';

export async function updateCentroOrigemDb(
  db: DrizzleClient,
  centro: string,
  data: UpdateCentroOrigemInput,
) {
  const values: Partial<typeof centrosOrigem.$inferInsert> = {};

  if (data.nome !== undefined) {
    values.nome = data.nome.trim();
  }

  if (Object.keys(values).length === 0) {
    return findCentroOrigemByIdDb(db, centro);
  }

  const [record] = await db
    .update(centrosOrigem)
    .set(values)
    .where(eq(centrosOrigem.centro, centro))
    .returning();

  if (!record) {
    return null;
  }

  return findCentroOrigemByIdDb(db, record.centro);
}
