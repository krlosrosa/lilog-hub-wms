import { eq } from 'drizzle-orm';

import type { CancelarCncInput } from '../../../domain/repositories/cnc/cnc.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { naoConformidades } from '../providers/drizzle/config/migrations/schema.js';
import { mapCncRow, toCancelarCncUpdateValues } from './map-cnc.drizzle.js';

export async function cancelarCncDb(
  db: DrizzleClient,
  id: string,
  data: CancelarCncInput,
) {
  const [row] = await db
    .update(naoConformidades)
    .set(toCancelarCncUpdateValues(data))
    .where(eq(naoConformidades.id, id))
    .returning();

  return row ? mapCncRow(row) : null;
}
