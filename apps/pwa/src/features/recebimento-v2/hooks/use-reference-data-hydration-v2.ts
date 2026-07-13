import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef } from 'react';

import { isApiConfigured } from '@/lib/offline/api-client';
import { useNetworkStatus } from '@/lib/offline/hooks/use-network';

import { ensureRecebimentoV2DbReady, recebimentoV2Db } from '../local-db/db';
import { refreshReferenceData } from '../services/reference-data.service';

/**
 * Refreshes docas + parametros de conferencia when opening a demand online.
 * Keeps unitConfigs (ex.: exigirEtiquetaPesoVariavel) in sync with the server
 * without requiring a full re-bootstrap.
 */
export function useReferenceDataHydrationV2(demandId: string): void {
  const { isOnline } = useNetworkStatus();
  const hydratedRef = useRef(false);

  const process = useLiveQuery(
    () => recebimentoV2Db.processes.get(demandId),
    [demandId],
  );

  const unidadeId = process?.unidadeId;

  useEffect(() => {
    if (!isOnline || !unidadeId || !isApiConfigured()) {
      return;
    }

    if (hydratedRef.current) {
      return;
    }

    hydratedRef.current = true;

    void ensureRecebimentoV2DbReady()
      .then(() => refreshReferenceData(unidadeId))
      .catch(() => {
        hydratedRef.current = false;
      });

    return () => {
      hydratedRef.current = false;
    };
  }, [demandId, isOnline, unidadeId]);
}
