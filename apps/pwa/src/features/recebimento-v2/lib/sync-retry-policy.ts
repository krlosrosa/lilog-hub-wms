import { calculateNextAttemptAt, isReadyToRetry } from '@lilog/local-sync';
import type { RetryPolicy } from '@lilog/local-sync';

import type { SyncOperationRecord } from '../local-db/schema';

export const RECEBIMENTO_V2_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 2_000,
  maxDelayMs: 60_000,
  backoffFactor: 2,
  jitter: 0.1,
};

export function isOpAutoSyncable(op: SyncOperationRecord): boolean {
  if (op.status !== 'pending' && op.status !== 'retry') {
    return false;
  }

  return isReadyToRetry(op, RECEBIMENTO_V2_RETRY_POLICY);
}

export function isOpRetryExhausted(op: SyncOperationRecord): boolean {
  return op.attempts >= RECEBIMENTO_V2_RETRY_POLICY.maxAttempts;
}

export function nextRetryAttemptAt(attempts: number): number {
  return calculateNextAttemptAt(attempts, RECEBIMENTO_V2_RETRY_POLICY);
}
