import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import {
  getHasSubmitConferenciaInFlight,
  subscribeSubmitConferenciaInFlight,
} from '@/features/recebimento/lib/submit-conferencia';

import { db } from '../db';
import { getIsFlushing, subscribeSyncFlushing } from '../sync-engine';

export function useSyncStatus() {
  const [isFlushing, setIsFlushing] = useState(getIsFlushing);
  const [recebimentoInFlight, setRecebimentoInFlight] = useState(
    getHasSubmitConferenciaInFlight,
  );
  const entries = useLiveQuery(() => db.outbox.toArray(), []);
  const syncMeta = useLiveQuery(() => db.syncMeta.get('global'), []);
  const pendingRecebimentosCount =
    useLiveQuery(
      () => db.demands.filter((demand) => demand.pendingOfflineSync === true).count(),
      [],
    ) ?? 0;

  useEffect(() => subscribeSyncFlushing(() => setIsFlushing(getIsFlushing())), []);
  useEffect(
    () =>
      subscribeSubmitConferenciaInFlight(() =>
        setRecebimentoInFlight(getHasSubmitConferenciaInFlight()),
      ),
    [],
  );

  const pending =
    entries?.filter((e) => e.status === 'pending' || e.status === 'syncing') ?? [];
  const errors = entries?.filter((e) => e.status === 'error') ?? [];
  const discarded = entries?.filter((e) => e.status === 'discarded') ?? [];

  const isSyncing =
    isFlushing ||
    recebimentoInFlight ||
    pending.some((entry) => entry.status === 'syncing');

  return {
    pendingCount: pending.length + pendingRecebimentosCount,
    pending,
    pendingRecebimentosCount,
    errors,
    errorCount: errors.length,
    discarded,
    discardedCount: discarded.length,
    isSyncing,
    lastSyncAt: syncMeta?.lastSyncAt ?? null,
    todaySyncedCount: syncMeta?.todaySyncedCount ?? 0,
    hasIssues: errors.length > 0 || discarded.length > 0,
  };
}
