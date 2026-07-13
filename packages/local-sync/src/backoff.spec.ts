import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateNextAttemptAt, isReadyToRetry } from './backoff.js';
import type { RetryPolicy } from './types.js';

const policy: RetryPolicy = {
  maxAttempts: 5,
  initialDelayMs: 1_000,
  maxDelayMs: 30_000,
  backoffFactor: 2,
  jitter: 0, // no jitter for deterministic tests
};

afterEach(() => {
  vi.useRealTimers();
});

describe('calculateNextAttemptAt', () => {
  it('First retry uses initialDelay (attempts=0)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const next = calculateNextAttemptAt(0, policy);
    expect(next).toBeCloseTo(1_000, -1);
  });

  it('Second retry uses initialDelay * factor (attempts=1)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const next = calculateNextAttemptAt(1, policy);
    expect(next).toBeCloseTo(2_000, -1);
  });

  it('Caps at maxDelay', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const next = calculateNextAttemptAt(10, policy);
    expect(next).toBeCloseTo(30_000, -1); // capped
  });

  it('Applies jitter when configured', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const jittered = calculateNextAttemptAt(0, { ...policy, jitter: 0.5 });
    // Should be between 500ms and 1500ms from now
    expect(jittered).toBeGreaterThanOrEqual(500);
    expect(jittered).toBeLessThanOrEqual(1_500);
  });
});

describe('isReadyToRetry', () => {
  it('Returns true when no nextAttemptAt set', () => {
    expect(isReadyToRetry({ attempts: 0 }, policy)).toBe(true);
  });

  it('Returns false when attempts >= maxAttempts', () => {
    expect(isReadyToRetry({ attempts: 5, nextAttemptAt: 0 }, policy)).toBe(false);
  });

  it('Returns false when nextAttemptAt is in the future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    expect(isReadyToRetry({ attempts: 1, nextAttemptAt: 5_000 }, policy)).toBe(false);
  });

  it('Returns true when nextAttemptAt is in the past', () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    expect(isReadyToRetry({ attempts: 1, nextAttemptAt: 5_000 }, policy)).toBe(true);
  });
});
