import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';

import {
  acceptServerConflict,
  keepLocalConflict,
} from '../services/conflict-resolution-v2.service';
import { recebimentoV2Db } from '../local-db/db.js';
import type { SyncConflictRecord } from '../local-db/schema.js';

export interface UseConflictV2Result {
  conflicts: SyncConflictRecord[];
  isLoading: boolean;
  getPendingConflicts: () => SyncConflictRecord[];
  acceptServer: (conflictId: string) => Promise<void>;
  keepLocal: (conflictId: string) => Promise<void>;
}

export function useConflictV2(demandId: string): UseConflictV2Result {
  const conflicts = useLiveQuery(
    () =>
      recebimentoV2Db.syncConflicts
        .where('aggregateId')
        .equals(demandId)
        .and((c) => !c.resolved)
        .toArray(),
    [demandId],
  );

  const getPendingConflicts = useCallback(
    () => (conflicts ?? []).filter((c) => !c.resolved),
    [conflicts],
  );

  const acceptServer = useCallback(
    async (conflictId: string): Promise<void> => {
      await acceptServerConflict(demandId, conflictId);
    },
    [demandId],
  );

  const keepLocal = useCallback(
    async (conflictId: string): Promise<void> => {
      await keepLocalConflict(demandId, conflictId);
    },
    [demandId],
  );

  return {
    conflicts: conflicts ?? [],
    isLoading: conflicts === undefined,
    getPendingConflicts,
    acceptServer,
    keepLocal,
  };
}
