import { PermanentSyncError, TransientSyncError, classifyError } from '../errors/index.js';
import type { Clock } from '../ports/Clock.js';

export interface RetryPolicyConfig {
  scheduleMs: number[];
  maxAttempts: number;
  jitterRatio: number;
}

export const DEFAULT_RETRY_SCHEDULE_MS = [
  0,
  5_000,
  15_000,
  30_000,
  60_000,
  300_000,
  600_000,
];

export class RetryPolicy {
  constructor(
    private readonly config: RetryPolicyConfig = {
      scheduleMs: DEFAULT_RETRY_SCHEDULE_MS,
      maxAttempts: DEFAULT_RETRY_SCHEDULE_MS.length,
      jitterRatio: 0.1,
    },
    private readonly clock: Clock,
  ) {}

  canRetry(retryCount: number): boolean {
    return retryCount < this.config.maxAttempts;
  }

  getDelayMs(retryCount: number): number {
    const schedule = this.config.scheduleMs;
    const base = schedule[Math.min(retryCount, schedule.length - 1)] ?? schedule.at(-1) ?? 0;
    const jitterRange = base * this.config.jitterRatio;
    const jitter = Math.random() * jitterRange * 2 - jitterRange;
    return Math.max(0, base + jitter);
  }

  nextAttemptAt(retryCount: number): number {
    return this.clock.now() + this.getDelayMs(retryCount);
  }

  classify(error: unknown): TransientSyncError | PermanentSyncError {
    const classified = classifyError(error);
    if (classified instanceof TransientSyncError || classified instanceof PermanentSyncError) {
      return classified;
    }
    return classified.retryable
      ? new TransientSyncError(classified.message, classified.code)
      : new PermanentSyncError(classified.message, classified.code);
  }
}

export function isReadyForRetry(
  retryCount: number,
  nextAttemptAt: number | undefined,
  now: number,
  policy: RetryPolicy,
): boolean {
  if (!policy.canRetry(retryCount)) return false;
  if (nextAttemptAt === undefined) return true;
  return now >= nextAttemptAt;
}
