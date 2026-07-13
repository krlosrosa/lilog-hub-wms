import { useLiveQuery } from 'dexie-react-hooks';

import { getImpedimentoSyncState, type ImpedimentoSyncState } from '../lib/impedimento-sync-state';
import { recebimentoV2Db } from '../local-db/db';

const EMPTY_STATE: ImpedimentoSyncState = {
  hasImpedimento: false,
  isSyncedOnServer: false,
  canRetomar: false,
  hasPendingSuspender: false,
  hasFailedSuspender: false,
  blockingMessage: null,
  suspenderErrorMessage: null,
};

export function useImpedimentoSyncState(demandId: string) {
  return useLiveQuery(async () => {
    await recebimentoV2Db.syncOperations
      .where('aggregateId')
      .equals(demandId)
      .count();

    return getImpedimentoSyncState(demandId);
  }, [demandId], EMPTY_STATE);
}
