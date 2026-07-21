import type { Transaction } from 'dexie';
import type { RecebimentoV2DB } from '../db.js';
import type { SyncOperationRecord } from '../schema.js';
import { deriveLifecycleFromStatus } from '../../lib/sync-operation-lifecycle.js';

type EnqueueInput = Omit<SyncOperationRecord, 'id' | 'attempts' | 'status' | 'createdAt' | 'updatedAt'>;

export class SyncOperationRepository {
  constructor(private readonly db: RecebimentoV2DB) {}

  async enqueue(input: EnqueueInput, tx?: Transaction): Promise<string> {
    const now = Date.now();
    const record: SyncOperationRecord = {
      ...input,
      id: crypto.randomUUID(),
      attempts: 0,
      status: 'pending',
      lifecycleStatus: deriveLifecycleFromStatus('pending'),
      createdAt: now,
      updatedAt: now,
    };

    const table = tx
      ? tx.table<SyncOperationRecord, string>('syncOperations')
      : this.db.syncOperations;

    await table.add(record);
    return record.id;
  }

  /**
   * Atomically applies a domain projection and enqueues the corresponding sync
   * operation within the same Dexie transaction.
   */
  async enqueueWithProjection(
    projection: (tx: Transaction) => Promise<void>,
    input: EnqueueInput,
    db: RecebimentoV2DB,
  ): Promise<void> {
    await db.transaction('rw', db.syncOperations, db.conferences, db.checklists, db.temperatures, db.damages, async (tx) => {
      await projection(tx);
      await this.enqueue(input, tx);
    });
  }

  async getPendingByAggregate(aggregateId: string): Promise<SyncOperationRecord[]> {
    return this.db.syncOperations
      .where('aggregateId')
      .equals(aggregateId)
      .filter((op) =>
        op.status === 'pending' ||
        op.status === 'retry' ||
        op.status === 'blocked' ||
        op.status === 'syncing',
      )
      .sortBy('createdAt');
  }

  async markSyncing(id: string): Promise<void> {
    await this.db.syncOperations.update(id, {
      status: 'syncing',
      lifecycleStatus: deriveLifecycleFromStatus('syncing'),
      updatedAt: Date.now(),
    });
  }

  async markSynced(id: string, serverRevision: number): Promise<void> {
    await this.db.syncOperations.update(id, {
      status: 'synced',
      lifecycleStatus: deriveLifecycleFromStatus('synced'),
      updatedAt: Date.now(),
      // Store serverRevision in payload as metadata (no dedicated column)
    });
    void serverRevision; // used by caller to update process record
  }

  async markRetry(id: string, message: string, nextAttemptAt: number): Promise<void> {
    await this.db.syncOperations.update(id, {
      status: 'retry',
      lifecycleStatus: deriveLifecycleFromStatus('retry'),
      errorMessage: message,
      nextAttemptAt,
      updatedAt: Date.now(),
    });

    // Increment attempts via a read-modify-write
    const op = await this.db.syncOperations.get(id);
    if (op) {
      await this.db.syncOperations.update(id, { attempts: op.attempts + 1 });
    }
  }

  async markRejected(id: string, message: string): Promise<void> {
    await this.db.syncOperations.update(id, {
      status: 'rejected',
      lifecycleStatus: deriveLifecycleFromStatus('rejected'),
      errorMessage: message,
      updatedAt: Date.now(),
    });
  }

  async markConflict(id: string): Promise<void> {
    await this.db.syncOperations.update(id, {
      status: 'conflict',
      lifecycleStatus: deriveLifecycleFromStatus('conflict'),
      updatedAt: Date.now(),
    });
  }

  /**
   * Resets operations stuck in 'syncing' back to 'pending' — called on app
   * startup to recover from crashes.
   *
   * @returns number of operations reset
   */
  async resetOrphaned(): Promise<number> {
    const orphaned = await this.db.syncOperations
      .where('status')
      .equals('syncing')
      .toArray();

    const now = Date.now();
    for (const op of orphaned) {
      await this.db.syncOperations.update(op.id, {
        status: 'pending',
        lifecycleStatus: deriveLifecycleFromStatus('pending'),
        updatedAt: now,
      });
    }

    return orphaned.length;
  }
}
