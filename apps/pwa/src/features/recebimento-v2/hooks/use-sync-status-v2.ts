import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';

import { buildSyncIssueOperations, type SyncIssueOperation } from '../lib/sync-operation-labels';
import { recebimentoV2Db } from '../local-db/db';
import { countPendingPhotoUploads, recoverStuckSyncState } from '../services/sync-photo.helpers';
import { repairSyncOperations } from '../services/repair-sync-operations.service';
import { triggerAutoSyncIfPending } from '../services/auto-sync-v2.service';

export type { SyncIssueOperation };

export interface UseSyncStatusV2Result {
  pendingCount: number;
  blockedCount: number;
  conflictCount: number;
  retryCount: number;
  rejectedCount: number;
  pendingPhotoCount: number;
  photoErrorCount: number;
  issueOperations: SyncIssueOperation[];
  isSyncing: boolean;
  lastSyncedAt: number | null;
  lastPullAt: number | null;
  /** @deprecated Prefer DB-driven isSyncing; kept for manual sync callers */
  setIsSyncing: (value: boolean) => void;
}

export function useSyncStatusV2(demandId: string): UseSyncStatusV2Result {
  const [manualSyncing, setManualSyncing] = useState(false);

  useEffect(() => {
    void (async () => {
      await recoverStuckSyncState(demandId);
      const repaired = await repairSyncOperations(demandId);
      if (repaired > 0) {
        triggerAutoSyncIfPending(demandId);
      }
    })();
  }, [demandId]);

  const result = useLiveQuery(async () => {
    const [ops, conferences, process, photoCounts] = await Promise.all([
      recebimentoV2Db.syncOperations
        .where('aggregateId')
        .equals(demandId)
        .toArray(),
      recebimentoV2Db.conferences.where('demandId').equals(demandId).toArray(),
      recebimentoV2Db.processes.get(demandId),
      countPendingPhotoUploads(demandId),
    ]);

    const conferenceById = new Map(conferences.map((conference) => [conference.id, conference]));
    const issueOperations = buildSyncIssueOperations(ops, conferenceById);

    const pendingCount = ops.filter((op) => op.status === 'pending').length;
    const blockedCount = ops.filter((op) => op.status === 'blocked').length;
    const conflictCount = ops.filter((op) => op.status === 'conflict').length;
    const rejectedCount = ops.filter((op) => op.status === 'rejected').length;
    const retryCount = ops.filter((op) => op.status === 'retry').length;
    const syncingOpsCount = ops.filter((op) => op.status === 'syncing').length;
    const lastSyncedAt = process?.lastSyncedAt ?? null;
    const lastPullAt = process?.lastPullAt ?? null;
    const processSyncing = process?.status === 'syncing';
    const pendingPhotoCount =
      photoCounts.pending + photoCounts.uploading + photoCounts.error;

    return {
      pendingCount,
      blockedCount,
      conflictCount,
      retryCount,
      rejectedCount,
      pendingPhotoCount,
      photoErrorCount: photoCounts.error,
      issueOperations,
      lastSyncedAt,
      lastPullAt,
      isSyncingFromDb:
        processSyncing ||
        syncingOpsCount > 0 ||
        photoCounts.uploading > 0,
    };
  }, [demandId]);

  return {
    pendingCount: result?.pendingCount ?? 0,
    blockedCount: result?.blockedCount ?? 0,
    conflictCount: result?.conflictCount ?? 0,
    retryCount: result?.retryCount ?? 0,
    rejectedCount: result?.rejectedCount ?? 0,
    pendingPhotoCount: result?.pendingPhotoCount ?? 0,
    photoErrorCount: result?.photoErrorCount ?? 0,
    issueOperations: result?.issueOperations ?? [],
    isSyncing: manualSyncing || (result?.isSyncingFromDb ?? false),
    lastSyncedAt: result?.lastSyncedAt ?? null,
    lastPullAt: result?.lastPullAt ?? null,
    setIsSyncing: setManualSyncing,
  };
}
