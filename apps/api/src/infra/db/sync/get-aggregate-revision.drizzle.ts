import { and, eq, sql } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { syncAggregateRevisions } from '../providers/drizzle/config/migrations/schema.js';

export async function getAggregateRevisionDb(
  db: DrizzleClient,
  adapter: string,
  aggregateId: string,
): Promise<number> {
  const [row] = await db
    .select({ revision: syncAggregateRevisions.revision })
    .from(syncAggregateRevisions)
    .where(
      and(
        eq(syncAggregateRevisions.adapter, adapter),
        eq(syncAggregateRevisions.aggregateId, aggregateId),
      ),
    )
    .limit(1);

  return row?.revision ?? 0;
}

export async function incrementAggregateRevisionDb(
  db: DrizzleClient,
  adapter: string,
  aggregateId: string,
  unidadeId: string,
): Promise<number> {
  const [row] = await db
    .insert(syncAggregateRevisions)
    .values({
      adapter,
      aggregateId,
      unidadeId,
      revision: 1,
    })
    .onConflictDoUpdate({
      target: [syncAggregateRevisions.adapter, syncAggregateRevisions.aggregateId],
      set: {
        revision: sql`${syncAggregateRevisions.revision} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({ revision: syncAggregateRevisions.revision });

  if (!row) throw new Error('Failed to increment aggregate revision');
  return row.revision;
}
