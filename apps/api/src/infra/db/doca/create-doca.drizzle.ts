import type { CreateDocaInput } from '../../../domain/model/doca/doca.model.js';
import type { DocaRecord } from '../../../domain/repositories/doca/doca.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { docas } from '../providers/drizzle/config/migrations/schema.js';
import { findDocaByIdDb } from './find-doca.drizzle.js';
import { toDocaInsertValues } from './map-doca.drizzle.js';

export async function createDocaDb(
  db: DrizzleClient,
  data: CreateDocaInput,
): Promise<DocaRecord> {
  const [record] = await db
    .insert(docas)
    .values(toDocaInsertValues(data))
    .returning();

  if (!record) {
    throw new Error('Failed to create doca');
  }

  const created = await findDocaByIdDb(db, record.id);

  if (!created) {
    throw new Error('Failed to load created doca');
  }

  return created;
}
