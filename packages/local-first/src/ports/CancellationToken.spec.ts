import { describe, expect, it } from 'vitest';
import { AbortCancellationToken } from '../ports/CancellationToken.js';
import { CancelledSyncError } from '../errors/index.js';

describe('CancellationToken', () => {
  it('throws after cancellation', () => {
    const token = new AbortCancellationToken();
    token.cancel();
    expect(() => token.throwIfCancelled()).toThrow(CancelledSyncError);
  });

  it('notifies listeners', () => {
    const token = new AbortCancellationToken();
    let called = false;
    token.onCancelled(() => {
      called = true;
    });
    token.cancel();
    expect(called).toBe(true);
  });
});
