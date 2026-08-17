import type { Operation } from '../operations/Operation.js';
import type { OperationQuery } from '../types/index.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';

export interface QueueRepository {
  save(operation: Operation): Promise<void>;
  update(id: string, patch: Partial<Operation>): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Operation | undefined>;
  findByIdempotencyKey(key: string): Promise<Operation | undefined>;
  findPending(query?: OperationQuery): Promise<Operation[]>;
  claim(ids: string[], now: number): Promise<Operation[]>;
  markCompleted(ids: string[], now: number): Promise<void>;
  markFailed(id: string, error: string, now: number, nextAttemptAt?: number): Promise<void>;
  markCancelled(id: string, reason: string, now: number): Promise<void>;
  recoverOrphanedRunning(now: number): Promise<number>;
}

export class StorageQueueRepository implements QueueRepository {
  constructor(private readonly storage: StorageAdapter) {}

  async save(operation: Operation): Promise<void> {
    await this.storage.saveOperation(operation);
  }

  async update(id: string, patch: Partial<Operation>): Promise<void> {
    await this.storage.updateOperation(id, patch);
  }

  async delete(id: string): Promise<void> {
    await this.storage.deleteOperation(id);
  }

  async findById(id: string): Promise<Operation | undefined> {
    return this.storage.findOperation(id);
  }

  async findByIdempotencyKey(key: string): Promise<Operation | undefined> {
    const ops = await this.storage.findOperations({ limit: 1000 });
    return ops.find((op) => op.idempotencyKey === key);
  }

  async findPending(query: OperationQuery = {}): Promise<Operation[]> {
    return this.storage.findOperations({
      ...query,
      status: query.status ?? ['Pending', 'Retrying', 'WaitingDependency'],
    });
  }

  async claim(ids: string[], now: number): Promise<Operation[]> {
    return this.storage.transaction(async () => {
      const claimed: Operation[] = [];
      for (const id of ids) {
        const op = await this.storage.findOperation(id);
        if (!op) continue;
        if (op.status !== 'Pending' && op.status !== 'Retrying') continue;
        const updated: Operation = {
          ...op,
          status: 'Running',
          updatedAt: now,
        };
        await this.storage.updateOperation(id, updated);
        claimed.push(updated);
      }
      return claimed;
    });
  }

  async markCompleted(ids: string[], now: number): Promise<void> {
    await this.storage.transaction(async () => {
      for (const id of ids) {
        await this.storage.updateOperation(id, {
          status: 'Completed',
          updatedAt: now,
          lastError: undefined,
        });
      }
    });
  }

  async markFailed(
    id: string,
    error: string,
    now: number,
    nextAttemptAt?: number,
  ): Promise<void> {
    const op = await this.storage.findOperation(id);
    if (!op) return;
    await this.storage.updateOperation(id, {
      status: nextAttemptAt !== undefined ? 'Retrying' : 'Failed',
      retryCount: op.retryCount + 1,
      nextAttemptAt,
      lastError: error,
      updatedAt: now,
    });
  }

  async markCancelled(id: string, reason: string, now: number): Promise<void> {
    await this.storage.updateOperation(id, {
      status: 'Cancelled',
      lastError: reason,
      updatedAt: now,
    });
  }

  async recoverOrphanedRunning(now: number): Promise<number> {
    const running = await this.storage.findOperations({ status: 'Running' });
    await this.storage.transaction(async () => {
      for (const op of running) {
        await this.storage.updateOperation(op.id, {
          status: 'Pending',
          updatedAt: now,
        });
      }
    });
    return running.length;
  }
}
