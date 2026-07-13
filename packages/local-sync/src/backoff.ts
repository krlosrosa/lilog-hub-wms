import type { RetryPolicy } from './types.js';

// ---------------------------------------------------------------------------
// Exponential backoff with jitter
// ---------------------------------------------------------------------------

/**
 * Calculates the timestamp (ms since epoch) at which the next attempt should be made.
 *
 * delay = min(maxDelay, initialDelay * factor^attempts) * (1 ± jitter)
 *
 * @param attempts - number of attempts already made (0-indexed)
 * @param policy - retry policy configuration
 * @returns absolute timestamp in ms for next attempt
 */
export function calculateNextAttemptAt(attempts: number, policy: RetryPolicy): number {
  const base = policy.initialDelayMs * Math.pow(policy.backoffFactor, attempts);
  const capped = Math.min(base, policy.maxDelayMs);
  const jitterRange = capped * policy.jitter;
  const jittered = capped + (Math.random() * 2 - 1) * jitterRange;
  return Date.now() + Math.max(0, jittered);
}

/**
 * Returns true when the operation is ready for another retry attempt.
 */
export function isReadyToRetry(
  op: { nextAttemptAt?: number; attempts: number },
  policy: RetryPolicy,
): boolean {
  if (op.attempts >= policy.maxAttempts) return false;
  if (op.nextAttemptAt === undefined) return true;
  return Date.now() >= op.nextAttemptAt;
}
