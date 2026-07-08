import { and, desc, eq, sql } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { cncTratativas } from '../providers/drizzle/config/migrations/schema.js';
import { mapCncTratativaRow } from './map-cnc.drizzle.js';

export async function listCncTratativasDb(db: DrizzleClient, cncId: string) {
  const rows = await db
    .select()
    .from(cncTratativas)
    .where(eq(cncTratativas.cncId, cncId))
    .orderBy(desc(cncTratativas.createdAt));

  return rows.map(mapCncTratativaRow);
}

export async function countCncTratativasDb(db: DrizzleClient, cncId: string) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cncTratativas)
    .where(eq(cncTratativas.cncId, cncId));

  return result[0]?.count ?? 0;
}

export async function countCncTratativasPendentesDb(
  db: DrizzleClient,
  cncId: string,
) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cncTratativas)
    .where(
      and(eq(cncTratativas.cncId, cncId), eq(cncTratativas.status, 'pendente')),
    );

  return result[0]?.count ?? 0;
}
