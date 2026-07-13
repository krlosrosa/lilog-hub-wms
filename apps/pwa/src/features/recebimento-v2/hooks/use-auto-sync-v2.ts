import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';

import { recebimentoV2Db } from '../local-db/db';
import {
  registerAutoSyncForDemand,
  triggerAutoSyncIfPending,
} from '../services/auto-sync-v2.service';

/**
 * Enables debounced auto-sync for the active demand:
 * - after local writes (pending/retry ops increase)
 * - when connectivity returns
 * - on tab focus
 * - every 45s while pending work exists
 */
export function useAutoSyncV2(demandId: string): void {
  const pendingWorkCount = useLiveQuery(async () => {
    const ops = await recebimentoV2Db.syncOperations
      .where('aggregateId')
      .equals(demandId)
      .toArray();

    return ops.filter((op) => op.status === 'pending' || op.status === 'retry').length;
  }, [demandId]);

  useEffect(() => registerAutoSyncForDemand(demandId), [demandId]);

  useEffect(() => {
    if ((pendingWorkCount ?? 0) > 0) {
      triggerAutoSyncIfPending(demandId);
    }
  }, [demandId, pendingWorkCount]);
}
