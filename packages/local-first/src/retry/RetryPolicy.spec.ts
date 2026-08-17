import { describe, expect, it } from 'vitest';
import { RetryPolicy, isReadyForRetry } from '../retry/RetryPolicy.js';
import { FakeClock } from '../testing/FakeClock.js';

describe('RetryPolicy', () => {
  it('uses explicit schedule and max attempts', () => {
    const clock = new FakeClock();
    const policy = new RetryPolicy(undefined, clock);

    expect(policy.canRetry(0)).toBe(true);
    expect(policy.canRetry(6)).toBe(true);
    expect(policy.canRetry(7)).toBe(false);
    expect(policy.getDelayMs(1)).toBeGreaterThanOrEqual(4_500);
    expect(policy.nextAttemptAt(2)).toBeGreaterThan(clock.now());
  });

  it('detects ready operations', () => {
    const clock = new FakeClock();
    const policy = new RetryPolicy(undefined, clock);
    expect(isReadyForRetry(1, clock.now() - 1, clock.now(), policy)).toBe(true);
    expect(isReadyForRetry(1, clock.now() + 10_000, clock.now(), policy)).toBe(false);
  });
});
