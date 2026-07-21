import { useEffect, useState } from 'react';

import { useNetworkStatus } from '@/lib/offline/hooks/use-network';

import {
  fetchRcServerDemandStatus,
  type RcServerDemandStatus,
} from '../lib/rc-server-sync-status';

export function useRcServerSyncStatus(preRecebimentoId: string | null | undefined) {
  const { isOnline } = useNetworkStatus();
  const [status, setStatus] = useState<RcServerDemandStatus | null>(null);

  useEffect(() => {
    if (!preRecebimentoId || !isOnline) {
      setStatus(null);
      return;
    }

    let cancelled = false;

    async function load() {
      const next = await fetchRcServerDemandStatus(preRecebimentoId!);
      if (!cancelled) {
        setStatus(next);
      }
    }

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isOnline, preRecebimentoId]);

  return { status, isOnline };
}
