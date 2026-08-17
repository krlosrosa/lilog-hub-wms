import { describe, expect, it } from 'vitest';
import { PushExecutor } from '../core/PushExecutor.js';
import { BatchOptimizer } from '../core/BatchOptimizer.js';
import { AggregateExecutionLock, InMemoryLockPort, ParallelismSemaphore } from '../core/AggregateExecutionLock.js';
import { SyncSession } from '../core/SyncSession.js';
import { EventBus } from '../events/EventBus.js';
import { OperationQueue } from '../queue/OperationQueue.js';
import { StorageQueueRepository } from '../queue/QueueRepository.js';
import { OperationRegistry } from '../operations/OperationRegistry.js';
import { RetryPolicy } from '../retry/RetryPolicy.js';
import { DefaultSyncStrategy } from '../strategy/SyncStrategy.js';
import { FakeHttpAdapter } from '../testing/FakeHttpAdapter.js';
import { InMemoryStorageAdapter } from '../testing/InMemoryStorageAdapter.js';
import { FakeClock } from '../testing/FakeClock.js';
import { UuidIdGenerator } from '../ports/IdGenerator.js';
import { NoOpLogger } from '../ports/Logger.js';
import { NoOpMetricsPort } from '../ports/MetricsPort.js';
import { JsonSerializer } from '../ports/Serializer.js';
import { neverCancelled } from '../ports/CancellationToken.js';
import type { OperationHandler } from '../operations/OperationHandler.js';

describe('PushExecutor', () => {
  it('pushes pending operations and marks them completed', async () => {
    const storage = new InMemoryStorageAdapter();
    const queue = new OperationQueue(
      new StorageQueueRepository(storage),
      new FakeClock(),
      new UuidIdGenerator(),
    );
    const registry = new OperationRegistry();
    const http = new FakeHttpAdapter();
    const handler: OperationHandler = {
      buildRequest: (operation) => ({
        method: 'POST',
        url: `/ops/${operation.id}`,
        body: operation.payload,
      }),
      applyResult: async () => {},
      onConflict: () => ({ action: 'acceptServer' }),
    };
    registry.register('create', handler);

    const op = await queue.enqueue({
      aggregateId: 'agg-1',
      aggregateType: 'Test',
      operationType: 'create',
      payload: { ok: true },
      sequence: 1,
    });

    const session = new SyncSession('session-1', Date.now());
    const executor = new PushExecutor({
      queue,
      registry,
      http,
      batchOptimizer: new BatchOptimizer(
        { batchSize: 10, maxBatchBytes: 1024 * 1024 },
        new JsonSerializer(),
      ),
      aggregateLock: new AggregateExecutionLock(new InMemoryLockPort(), 'device-1'),
      semaphore: new ParallelismSemaphore(2),
      retryPolicy: new RetryPolicy(undefined, new FakeClock()),
      strategy: new DefaultSyncStrategy(),
      events: new EventBus(),
      logger: new NoOpLogger(),
      metrics: new NoOpMetricsPort(),
    });

    const results = await executor.execute(session, neverCancelled());
    expect(results[0]?.succeeded).toContain(op.id);
    const stored = await storage.findOperation(op.id);
    expect(stored?.status).toBe('Completed');
  });
});
