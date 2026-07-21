import { describe, expect, it, vi } from 'vitest';
import { SyncScheduler } from '../core/SyncScheduler.js';
import { OperationQueue } from '../queue/OperationQueue.js';
import { StorageQueueRepository } from '../queue/QueueRepository.js';
import { InMemoryStorageAdapter } from '../testing/InMemoryStorageAdapter.js';
import { FakeClock, FakeTimer } from '../testing/FakeClock.js';
import { FakeConnectivityAdapter } from '../testing/FakeConnectivityAdapter.js';
import { UuidIdGenerator } from '../ports/IdGenerator.js';

describe('SyncScheduler', () => {
  it('debounces triggers and reruns when dirty', async () => {
    const clock = new FakeClock();
    const timer = new FakeTimer();
    const storage = new InMemoryStorageAdapter();
    const queue = new OperationQueue(
      new StorageQueueRepository(storage),
      clock,
      new UuidIdGenerator(),
    );
    const onTrigger = vi.fn(async () => {});
    const scheduler = new SyncScheduler({
      clock,
      timer,
      connectivity: new FakeConnectivityAdapter(),
      queue,
      debounceMs: 100,
      onTrigger,
    });

    scheduler.start();
    scheduler.scheduleTrigger(100);
    scheduler.scheduleTrigger(100);
    timer.runAll(clock);
    await Promise.resolve();
    expect(onTrigger).toHaveBeenCalledOnce();

    const first = scheduler.run();
    scheduler.run();
    await first;
    expect(onTrigger.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
