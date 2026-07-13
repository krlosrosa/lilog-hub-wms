import { and, eq } from 'drizzle-orm';

import type {
  CreateSyncOperationInput,
  SyncOperationRecord,
} from '../../../domain/repositories/sync/sync.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { syncOperations } from '../providers/drizzle/config/migrations/schema.js';

export function mapSyncOperationRow(
  row: typeof syncOperations.$inferSelect,
): SyncOperationRecord {
  return {
    id: row.id,
    batchId: row.batchId,
    opId: row.opId,
    opType: row.opType,
    sequence: row.sequence,
    status: row.status,
    errorMessage: row.errorMessage ?? null,
    appliedAt: row.appliedAt,
  };
}

export async function findSyncOperationByBatchAndOpIdDb(
  db: DrizzleClient,
  batchId: string,
  opId: string,
): Promise<SyncOperationRecord | null> {
  const [row] = await db
    .select()
    .from(syncOperations)
    .where(
      and(eq(syncOperations.batchId, batchId), eq(syncOperations.opId, opId)),
    )
    .limit(1);

  return row ? mapSyncOperationRow(row) : null;
}

export async function createSyncOperationDb(
  db: DrizzleClient,
  input: CreateSyncOperationInput,
): Promise<SyncOperationRecord> {
  const [row] = await db
    .insert(syncOperations)
    .values({
      batchId: input.batchId,
      opId: input.opId,
      opType: input.opType,
      sequence: input.sequence,
      status: input.status,
      errorMessage: input.errorMessage ?? null,
    })
    .returning();

  if (!row) throw new Error('Failed to create sync operation');
  return mapSyncOperationRow(row);
}
