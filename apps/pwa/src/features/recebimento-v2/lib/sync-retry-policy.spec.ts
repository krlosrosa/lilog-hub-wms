import { describe, expect, it } from 'vitest';

import {
  isOpAutoSyncable,
  isOpRetryExhausted,
  RECEBIMENTO_V2_RETRY_POLICY,
} from './sync-retry-policy';
import type { SyncOperationRecord } from '../local-db/schema';

function makeOp(overrides: Partial<SyncOperationRecord> = {}): SyncOperationRecord {
  const now = Date.now();
  return {
    id: 'op-1',
    aggregateId: 'demand-1',
    module: 'conference',
    opType: 'recebimento.item.conferir',
    sequence: now,
    dependsOn: [],
    idempotencyKey: 'key-1',
    payload: {},
    attachmentIds: [],
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('sync-retry-policy', () => {
  it('treats pending operations as auto-syncable', () => {
    expect(isOpAutoSyncable(makeOp({ status: 'pending', attempts: 0 }))).toBe(true);
  });

  it('blocks auto-sync when attempts reach maxAttempts', () => {
    expect(
      isOpAutoSyncable(
        makeOp({ status: 'retry', attempts: RECEBIMENTO_V2_RETRY_POLICY.maxAttempts }),
      ),
    ).toBe(false);
    expect(isOpRetryExhausted(makeOp({ attempts: RECEBIMENTO_V2_RETRY_POLICY.maxAttempts }))).toBe(
      true,
    );
  });

  it('respects nextAttemptAt backoff for retry operations', () => {
    expect(
      isOpAutoSyncable(
        makeOp({
          status: 'retry',
          attempts: 1,
          nextAttemptAt: Date.now() + 60_000,
        }),
      ),
    ).toBe(false);

    expect(
      isOpAutoSyncable(
        makeOp({
          status: 'retry',
          attempts: 1,
          nextAttemptAt: Date.now() - 1,
        }),
      ),
    ).toBe(true);
  });
});
