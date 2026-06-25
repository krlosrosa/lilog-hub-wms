import { eq } from 'drizzle-orm';

import type { UpdateTransportadoraInput } from '../../../domain/model/transportadora/transportadora.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportadoras } from '../providers/drizzle/config/migrations/schema.js';
import { findTransportadoraByIdDb } from './find-transportadora.drizzle.js';
import { toTransportadoraUpdateValues } from './map-transportadora.drizzle.js';

export async function updateTransportadoraDb(
  db: DrizzleClient,
  id: string,
  data: UpdateTransportadoraInput,
) {
  const [record] = await db
    .update(transportadoras)
    .set(toTransportadoraUpdateValues(data))
    .where(eq(transportadoras.id, id))
    .returning();

  if (!record) {
    return null;
  }

  return findTransportadoraByIdDb(db, record.id);
}
