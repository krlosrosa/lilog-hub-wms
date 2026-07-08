import { and, eq, sql } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportadoras } from '../providers/drizzle/config/migrations/schema.js';
import { mapTransportadoraRow } from './map-transportadora.drizzle.js';

export async function findTransportadoraByEmailDb(
  db: DrizzleClient,
  email: string,
) {
  const normalizedEmail = email.trim().toLowerCase();

  const [row] = await db
    .select()
    .from(transportadoras)
    .where(
      and(
        eq(transportadoras.status, 'ativa'),
        sql`lower(${normalizedEmail}) = ANY (
          SELECT lower(e)
          FROM unnest(${transportadoras.emails}) AS e
        )`,
      ),
    )
    .limit(1);

  return row ? mapTransportadoraRow(row) : null;
}
