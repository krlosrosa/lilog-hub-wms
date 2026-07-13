import type { RecordSyncChangeInput } from '../../../domain/repositories/sync/sync.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { syncChanges } from '../providers/drizzle/config/migrations/schema.js';

export async function recordSyncChangeDb(
  db: DrizzleClient,
  input: RecordSyncChangeInput,
): Promise<void> {
  await db.insert(syncChanges).values({
    adapter: input.adapter,
    unidadeId: input.unidadeId,
    entityType: input.entityType,
    entityId: input.entityId,
    operation: input.operation,
    revision: input.revision,
    payload: input.payload ?? null,
  });
}
