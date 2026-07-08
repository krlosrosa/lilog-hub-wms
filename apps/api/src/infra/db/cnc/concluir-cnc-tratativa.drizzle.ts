import { and, eq } from 'drizzle-orm';

import type { ConcluirCncTratativaInput } from '../../../domain/repositories/cnc/cnc.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { cncTratativas } from '../providers/drizzle/config/migrations/schema.js';
import {
  mapCncTratativaRow,
  toConcluirTratativaUpdateValues,
} from './map-cnc.drizzle.js';

export async function concluirCncTratativaDb(
  db: DrizzleClient,
  id: string,
  cncId: string,
  data: ConcluirCncTratativaInput,
) {
  const [row] = await db
    .update(cncTratativas)
    .set(toConcluirTratativaUpdateValues(data))
    .where(
      and(
        eq(cncTratativas.id, id),
        eq(cncTratativas.cncId, cncId),
        eq(cncTratativas.status, 'pendente'),
      ),
    )
    .returning();

  return row ? mapCncTratativaRow(row) : null;
}
