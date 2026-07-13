import { useEffect, useRef } from 'react';

import { useNetworkStatus } from '@/lib/offline/hooks/use-network';

import { ensureRecebimentoV2DbReady } from '../local-db/db';
import { pullDemand } from '../services/sync.service';

/**
 * Pulls server conferências/avarias when opening a demand online.
 * Skips overwriting locally-dirty records (handled inside pullDemand).
 */
export function useDemandHydrationV2(demandId: string): void {
  const { isOnline } = useNetworkStatus();
  const hydratedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOnline || hydratedRef.current === demandId) {
      return;
    }

    hydratedRef.current = demandId;
    void ensureRecebimentoV2DbReady()
      .then(() => pullDemand(demandId))
      .catch(() => {
        hydratedRef.current = null;
      });
  }, [demandId, isOnline]);
}
