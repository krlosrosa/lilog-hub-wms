import { eq } from 'drizzle-orm';

import type { IniciarAnaliseCncInput } from '../../../domain/repositories/cnc/cnc.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { naoConformidades } from '../providers/drizzle/config/migrations/schema.js';
import { mapCncRow, toIniciarAnaliseUpdateValues } from './map-cnc.drizzle.js';

export async function iniciarAnaliseCncDb(
  db: DrizzleClient,
  id: string,
  data: IniciarAnaliseCncInput,
) {
  const [row] = await db
    .update(naoConformidades)
    .set(toIniciarAnaliseUpdateValues(data))
    .where(eq(naoConformidades.id, id))
    .returning();

  return row ? mapCncRow(row) : null;
}
