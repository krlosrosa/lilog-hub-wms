import { describe, expect, it } from 'vitest';
import { DefaultSyncStrategy } from '../strategy/SyncStrategy.js';
import { createOperation } from '../operations/Operation.js';

describe('DefaultSyncStrategy', () => {
  const strategy = new DefaultSyncStrategy();
  const ctx = {
    now: Date.now(),
    online: true,
    pendingCount: 3,
    sessionId: 'session-1',
  };

  it('decides push and pull based on context', () => {
    expect(strategy.shouldPush(ctx)).toBe(true);
    expect(strategy.shouldPull(ctx)).toBe(true);
    expect(strategy.shouldCompact(ctx)).toBe(true);
  });

  it('retries until max attempts', () => {
    const op = createOperation(
      {
        aggregateId: 'agg',
        aggregateType: 'Test',
        operationType: 'update',
        payload: {},
        sequence: 1,
      },
      'op-1',
      1,
    );
    expect(strategy.shouldRetry({ ...op, retryCount: 2 }, new Error('x'))).toBe(true);
    expect(strategy.shouldRetry({ ...op, retryCount: 10 }, new Error('x'))).toBe(false);
  });
});
