import { useEffect, useRef } from 'react';

import { useUnidade } from '@/features/unidade';
import { useNetworkStatus } from '@/lib/offline/hooks/use-network';
import { useReplicache } from '@/lib/replicache/hooks';

import {
  flushPendingRcChecklistPhotoSync,
  flushPendingRcFinalizacaoSync,
} from '../services/sync-checklist-photos-rc.service';
import {
  reconcileAllRcDemandsWithOperadorApi,
  refreshReplicacheFromServer,
} from '../services/rc-replicache-refresh.service';

export function RcChecklistPhotoSyncWatcher() {
  const { rep, isReady } = useReplicache();
  const { unidadeSelecionada } = useUnidade();
  const { isOnline } = useNetworkStatus();
  const wasOnlineRef = useRef(isOnline);
  const lastRepRef = useRef<typeof rep>(null);

  useEffect(() => {
    if (!rep || !isReady || !isOnline) {
      wasOnlineRef.current = isOnline;
      return;
    }

    const cameOnline = isOnline && !wasOnlineRef.current;
    const repBecameReady = rep !== lastRepRef.current;

    wasOnlineRef.current = isOnline;
    lastRepRef.current = rep;

    if (cameOnline || repBecameReady) {
      void (async () => {
        await flushPendingRcChecklistPhotoSync();
        await flushPendingRcFinalizacaoSync();
        const unidadeId = unidadeSelecionada?.id;
        if (unidadeId) {
          await reconcileAllRcDemandsWithOperadorApi(rep, unidadeId);
        }
        await refreshReplicacheFromServer(rep);
      })();
    }
  }, [rep, isReady, isOnline, unidadeSelecionada?.id]);

  return null;
}
