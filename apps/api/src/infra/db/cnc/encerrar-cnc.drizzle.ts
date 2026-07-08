import { eq } from 'drizzle-orm';

import type { EncerrarCncInput } from '../../../domain/repositories/cnc/cnc.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { naoConformidades } from '../providers/drizzle/config/migrations/schema.js';
import { mapCncRow, toEncerrarCncUpdateValues } from './map-cnc.drizzle.js';

export async function encerrarCncDb(
  db: DrizzleClient,
  id: string,
  data: EncerrarCncInput,
) {
  const [row] = await db
    .update(naoConformidades)
    .set(toEncerrarCncUpdateValues(data))
    .where(eq(naoConformidades.id, id))
    .returning();

  return row ? mapCncRow(row) : null;
}
