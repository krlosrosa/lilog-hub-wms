import type { ProcessStatus } from '@lilog/contracts';
import { useLiveQuery } from 'dexie-react-hooks';

import { recebimentoV2Db } from '../local-db/db';
import type { ProcessRecord } from '../local-db/schema';

export interface UseProcessV2Result {
  process: ProcessRecord | undefined;
  isLoading: boolean;
  isReady: boolean;
  isPending: boolean;
  isConflict: boolean;
  status: ProcessStatus | undefined;
}

// Statuses that allow the user to enter the conference flow
const READY_STATUSES: ProcessStatus[] = ['ready', 'working', 'pendingSync', 'completed'];
const PENDING_STATUSES: ProcessStatus[] = ['notDownloaded', 'downloading'];

export function useProcessV2(demandId: string): UseProcessV2Result {
  const process = useLiveQuery(
    () => recebimentoV2Db.processes.get(demandId),
    [demandId],
  );

  const isLoading = process === undefined;
  const status = process?.status;

  return {
    process: process ?? undefined,
    isLoading,
    isReady: status != null && READY_STATUSES.includes(status),
    isPending: status == null || PENDING_STATUSES.includes(status),
    isConflict: status === 'conflict',
    status,
  };
}
