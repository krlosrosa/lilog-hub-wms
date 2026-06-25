import { eq } from 'drizzle-orm';

import type { UpdateDocaInput } from '../../../domain/model/doca/doca.model.js';
import type { DocaRecord } from '../../../domain/repositories/doca/doca.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { docas } from '../providers/drizzle/config/migrations/schema.js';
import { findDocaByIdDb } from './find-doca.drizzle.js';
import { toDocaUpdateValues } from './map-doca.drizzle.js';

export async function updateDocaDb(
  db: DrizzleClient,
  id: string,
  data: UpdateDocaInput,
): Promise<DocaRecord | null> {
  const [updated] = await db
    .update(docas)
    .set(toDocaUpdateValues(data))
    .where(eq(docas.id, id))
    .returning();

  if (!updated) {
    return null;
  }

  return findDocaByIdDb(db, id);
}
