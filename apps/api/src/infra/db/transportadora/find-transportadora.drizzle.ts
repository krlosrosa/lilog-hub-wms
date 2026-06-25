import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportadoras } from '../providers/drizzle/config/migrations/schema.js';
import { mapTransportadoraRow } from './map-transportadora.drizzle.js';

export async function findTransportadoraByIdDb(
  db: DrizzleClient,
  id: string,
) {
  const [row] = await db
    .select()
    .from(transportadoras)
    .where(eq(transportadoras.id, id))
    .limit(1);

  return row ? mapTransportadoraRow(row) : null;
}

export async function findTransportadoraByUnidadeAndRavexIdDb(
  db: DrizzleClient,
  unidadeId: string,
  idRavexTransportadora: number,
) {
  const [row] = await db
    .select()
    .from(transportadoras)
    .where(
      and(
        eq(transportadoras.unidadeId, unidadeId),
        eq(transportadoras.idRavexTransportadora, idRavexTransportadora),
      ),
    )
    .limit(1);

  return row ? mapTransportadoraRow(row) : null;
}
