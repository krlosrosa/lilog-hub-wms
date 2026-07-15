export interface SyncIssueCounts {
  pendingCount: number;
  pendingPhotoCount: number;
  conflictCount: number;
  rejectedCount: number;
  retryCount: number;
  blockedCount: number;
  photoErrorCount: number;
  isAutoSyncPaused: boolean;
}

export function hasVisibleSyncIssues(counts: SyncIssueCounts): boolean {
  return (
    counts.conflictCount > 0 ||
    counts.rejectedCount > 0 ||
    counts.retryCount > 0 ||
    counts.blockedCount > 0 ||
    counts.photoErrorCount > 0 ||
    (counts.isAutoSyncPaused &&
      (counts.pendingCount > 0 || counts.pendingPhotoCount > 0 || counts.retryCount > 0))
  );
}

export function isAutoSyncPausedWithWork(counts: SyncIssueCounts): boolean {
  return (
    counts.isAutoSyncPaused &&
    (counts.pendingCount > 0 || counts.pendingPhotoCount > 0 || counts.retryCount > 0)
  );
}
