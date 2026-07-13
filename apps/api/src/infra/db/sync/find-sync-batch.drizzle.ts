import { and, eq } from 'drizzle-orm';

import type { SyncBatchRecord } from '../../../domain/repositories/sync/sync.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { syncBatches } from '../providers/drizzle/config/migrations/schema.js';

export function mapSyncBatchRow(
  row: typeof syncBatches.$inferSelect,
): SyncBatchRecord {
  return {
    id: row.id,
    batchId: row.batchId,
    adapter: row.adapter,
    protocolVersion: row.protocolVersion,
    aggregateType: row.aggregateType,
    aggregateId: row.aggregateId,
    unidadeId: row.unidadeId,
    baseRevision: row.baseRevision,
    finalRevision: row.finalRevision ?? null,
    status: row.status,
    appliedCount: row.appliedCount,
    skippedCount: row.skippedCount,
    errorCount: row.errorCount,
    userId: row.userId ?? null,
    deviceId: row.deviceId ?? null,
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? null,
  };
}

export async function findSyncBatchByBatchIdAndAdapterDb(
  db: DrizzleClient,
  batchId: string,
  adapter: string,
): Promise<SyncBatchRecord | null> {
  const [row] = await db
    .select()
    .from(syncBatches)
    .where(
      and(eq(syncBatches.batchId, batchId), eq(syncBatches.adapter, adapter)),
    )
    .limit(1);

  return row ? mapSyncBatchRow(row) : null;
}
