import { describe, expect, it } from 'vitest';
import {
  AggregateExecutionLock,
  InMemoryLockPort,
  ParallelismSemaphore,
} from '../core/AggregateExecutionLock.js';

describe('AggregateExecutionLock', () => {
  it('allows only one lock per aggregate', async () => {
    const port = new InMemoryLockPort();
    const lockA = new AggregateExecutionLock(port, 'device-1');
    const lockB = new AggregateExecutionLock(port, 'device-2');

    expect(await lockA.acquire('agg-1')).toBe(true);
    expect(await lockB.acquire('agg-1')).toBe(false);
    await lockA.release('agg-1');
    expect(await lockB.acquire('agg-1')).toBe(true);
  });

  it('allows parallel locks on different aggregates', async () => {
    const port = new InMemoryLockPort();
    const lock = new AggregateExecutionLock(port, 'device-1');
    expect(await lock.acquire('agg-1')).toBe(true);
    expect(await lock.acquire('agg-2')).toBe(true);
  });
});

describe('ParallelismSemaphore', () => {
  it('limits concurrent workers', async () => {
    const semaphore = new ParallelismSemaphore(2);
    const release1 = await semaphore.acquire();
    const release2 = await semaphore.acquire();
    let released = false;
    const pending = semaphore.acquire().then(() => {
      released = true;
    });
    expect(released).toBe(false);
    release1();
    await pending;
    release2();
    expect(released).toBe(true);
  });
});
