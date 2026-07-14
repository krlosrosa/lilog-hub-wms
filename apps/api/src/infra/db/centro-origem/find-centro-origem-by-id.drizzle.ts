import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { centrosOrigem } from '../providers/drizzle/config/migrations/schema.js';
import { mapCentroOrigemRow } from './map-centro-origem.drizzle.js';

export async function findCentroOrigemByIdDb(
  db: DrizzleClient,
  centro: string,
) {
  const [row] = await db
    .select()
    .from(centrosOrigem)
    .where(eq(centrosOrigem.centro, centro))
    .limit(1);

  return row ? mapCentroOrigemRow(row) : null;
}
