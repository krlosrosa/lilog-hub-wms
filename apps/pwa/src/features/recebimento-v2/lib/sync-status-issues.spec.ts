import { describe, expect, it } from 'vitest';

import {
  hasVisibleSyncIssues,
  isAutoSyncPausedWithWork,
} from './sync-status-issues';

describe('sync-status-issues', () => {
  it('does not treat paused state as visible issue when queue is empty', () => {
    expect(
      hasVisibleSyncIssues({
        pendingCount: 0,
        pendingPhotoCount: 0,
        conflictCount: 0,
        rejectedCount: 0,
        retryCount: 0,
        blockedCount: 0,
        photoErrorCount: 0,
        isAutoSyncPaused: true,
      }),
    ).toBe(false);
  });

  it('shows paused issue when retry work still exists', () => {
    const counts = {
      pendingCount: 0,
      pendingPhotoCount: 0,
      conflictCount: 0,
      rejectedCount: 0,
      retryCount: 2,
      blockedCount: 0,
      photoErrorCount: 0,
      isAutoSyncPaused: true,
    };

    expect(hasVisibleSyncIssues(counts)).toBe(true);
    expect(isAutoSyncPausedWithWork(counts)).toBe(true);
  });
});
