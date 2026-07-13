import type { CreateSyncBatchInput, SyncBatchRecord } from '../../../domain/repositories/sync/sync.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { syncBatches } from '../providers/drizzle/config/migrations/schema.js';
import { mapSyncBatchRow } from './find-sync-batch.drizzle.js';

export async function createSyncBatchDb(
  db: DrizzleClient,
  input: CreateSyncBatchInput,
): Promise<SyncBatchRecord> {
  const [row] = await db
    .insert(syncBatches)
    .values({
      batchId: input.batchId,
      adapter: input.adapter,
      protocolVersion: input.protocolVersion,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      unidadeId: input.unidadeId,
      baseRevision: input.baseRevision,
      userId: input.userId ?? null,
      deviceId: input.deviceId ?? null,
      status: 'processing',
    })
    .returning();

  if (!row) throw new Error('Failed to create sync batch');
  return mapSyncBatchRow(row);
}
