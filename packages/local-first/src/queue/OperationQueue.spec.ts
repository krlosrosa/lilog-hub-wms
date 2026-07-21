import { describe, expect, it } from 'vitest';
import { OperationQueue } from '../queue/OperationQueue.js';
import { StorageQueueRepository } from '../queue/QueueRepository.js';
import { InMemoryStorageAdapter } from '../testing/InMemoryStorageAdapter.js';
import { FakeClock } from '../testing/FakeClock.js';
import { UuidIdGenerator } from '../ports/IdGenerator.js';

describe('OperationQueue', () => {
  it('deduplicates by idempotency key', async () => {
    const storage = new InMemoryStorageAdapter();
    const queue = new OperationQueue(
      new StorageQueueRepository(storage),
      new FakeClock(),
      new UuidIdGenerator(),
    );

    const first = await queue.enqueue({
      aggregateId: 'agg-1',
      aggregateType: 'Test',
      operationType: 'create',
      payload: { a: 1 },
      sequence: 1,
      idempotencyKey: 'key-1',
    });

    const second = await queue.enqueue({
      aggregateId: 'agg-1',
      aggregateType: 'Test',
      operationType: 'create',
      payload: { a: 2 },
      sequence: 2,
      idempotencyKey: 'key-1',
    });

    expect(second.id).toBe(first.id);
  });

  it('claims operations atomically', async () => {
    const storage = new InMemoryStorageAdapter();
    const queue = new OperationQueue(
      new StorageQueueRepository(storage),
      new FakeClock(),
      new UuidIdGenerator(),
    );

    const op = await queue.enqueue({
      aggregateId: 'agg-1',
      aggregateType: 'Test',
      operationType: 'create',
      payload: {},
      sequence: 1,
    });

    const claimed = await queue.claim([op.id]);
    expect(claimed[0]?.status).toBe('Running');
  });
});
