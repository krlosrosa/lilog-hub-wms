import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';

import { buildSyncIssueOperations, buildSyncQueueOperations, type PendingPhotoOperation, type SyncIssueOperation, type SyncQueueOperation } from '../lib/sync-operation-labels';
import { debugRecebimentoV2 } from '../lib/sync-debug';
import { recebimentoV2Db } from '../local-db/db';
import { countPendingPhotoUploads, listPendingPhotoUploads, recoverStuckSyncState } from '../services/sync-photo.helpers';
import { repairSyncOperations } from '../services/repair-sync-operations.service';
import { triggerAutoSyncIfPending } from '../services/auto-sync-v2.service';

export type { SyncIssueOperation, SyncQueueOperation, PendingPhotoOperation };

export interface UseSyncStatusV2Result {
  pendingCount: number;
  blockedCount: number;
  conflictCount: number;
  retryCount: number;
  rejectedCount: number;
  pendingPhotoCount: number;
  photoErrorCount: number;
  issueOperations: SyncIssueOperation[];
  queueOperations: SyncQueueOperation[];
  pendingPhotos: PendingPhotoOperation[];
  isSyncing: boolean;
  isAutoSyncPaused: boolean;
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
    const [ops, conferences, process, photoCounts, pendingPhotos] = await Promise.all([
      recebimentoV2Db.syncOperations
        .where('aggregateId')
        .equals(demandId)
        .toArray(),
      recebimentoV2Db.conferences.where('demandId').equals(demandId).toArray(),
      recebimentoV2Db.processes.get(demandId),
      countPendingPhotoUploads(demandId),
      listPendingPhotoUploads(demandId),
    ]);

    const conferenceById = new Map(conferences.map((conference) => [conference.id, conference]));
    const issueOperations = buildSyncIssueOperations(ops, conferenceById);
    const queueOperations = buildSyncQueueOperations(ops, conferenceById);

    const issueOps = ops.filter((op) => op.status === 'retry' || op.status === 'rejected');
    if (issueOps.length > 0) {
      debugRecebimentoV2('sync', 'issue ops', issueOps.map((op) => ({
        id: op.id,
        opType: op.opType,
        status: op.status,
        attempts: op.attempts,
        errorMessage: op.errorMessage,
        payload: op.payload,
      })));
    }

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
      queueOperations,
      pendingPhotos,
      lastSyncedAt,
      lastPullAt,
      isAutoSyncPaused: process?.autoSyncPaused ?? false,
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
    queueOperations: result?.queueOperations ?? [],
    pendingPhotos: result?.pendingPhotos ?? [],
    isSyncing: manualSyncing || (result?.isSyncingFromDb ?? false),
    isAutoSyncPaused: result?.isAutoSyncPaused ?? false,
    lastSyncedAt: result?.lastSyncedAt ?? null,
    lastPullAt: result?.lastPullAt ?? null,
    setIsSyncing: setManualSyncing,
  };
}
