import { eq } from 'drizzle-orm';

import type { CompleteSyncBatchInput } from '../../../domain/model/sync/sync.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { syncBatches } from '../providers/drizzle/config/migrations/schema.js';

export async function completeSyncBatchDb(
  db: DrizzleClient,
  id: string,
  result: CompleteSyncBatchInput,
): Promise<void> {
  await db
    .update(syncBatches)
    .set({
      finalRevision: result.finalRevision,
      status: result.status,
      appliedCount: result.appliedCount,
      skippedCount: result.skippedCount,
      errorCount: result.errorCount,
      completedAt: new Date(),
    })
    .where(eq(syncBatches.id, id));
}
