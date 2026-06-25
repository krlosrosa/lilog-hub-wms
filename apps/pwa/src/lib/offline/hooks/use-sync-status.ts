import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../db';
import { getIsFlushing } from '../sync-engine';

export function useSyncStatus() {
  const entries = useLiveQuery(() => db.outbox.toArray(), []);
  const syncMeta = useLiveQuery(() => db.syncMeta.get('global'), []);

  const pending =
    entries?.filter((e) => e.status === 'pending' || e.status === 'syncing') ?? [];
  const errors = entries?.filter((e) => e.status === 'error') ?? [];

  return {
    pendingCount: pending.length,
    pending,
    errors,
    errorCount: errors.length,
    isSyncing: getIsFlushing() || pending.some((e) => e.status === 'syncing'),
    lastSyncAt: syncMeta?.lastSyncAt ?? null,
    todaySyncedCount: syncMeta?.todaySyncedCount ?? 0,
    hasIssues: (errors.length ?? 0) > 0,
  };
}
