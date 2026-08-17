import { useLiveQuery } from 'dexie-react-hooks';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ensureRecebimentoV2DbReady } from '@/features/recebimento-v2/local-db/db';
import {
  getProductCatalogCount,
  updateProductCatalog,
} from '@/features/recebimento-v2/services/product-catalog.service';
import { useUnidade } from '@/features/unidade';
import { isApiConfigured } from '@/lib/offline/api-client';
import { useNetworkStatus } from '@/lib/offline/hooks/use-network';

const inFlightCatalogSync = new Map<string, Promise<void>>();

export interface ProductCatalogSyncState {
  isSyncingCatalog: boolean;
  catalogReady: boolean;
  catalogError: string | null;
}

export const ProductCatalogSyncContext = createContext<ProductCatalogSyncState>({
  isSyncingCatalog: false,
  catalogReady: false,
  catalogError: null,
});

export function useProductCatalogSyncState(): ProductCatalogSyncState {
  const { unidadeSelecionada } = useUnidade();
  const { isOnline } = useNetworkStatus();
  const unidadeId = unidadeSelecionada?.id ?? '';

  const [isSyncingCatalog, setIsSyncingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const lastSyncedUnidadeRef = useRef<string | null>(null);

  const catalogCount = useLiveQuery(
    () => (unidadeId ? getProductCatalogCount(unidadeId) : Promise.resolve(0)),
    [unidadeId],
  );

  const catalogReady = (catalogCount ?? 0) > 0;

  useEffect(() => {
    setCatalogError(null);

    if (!unidadeId || !isOnline || !isApiConfigured()) {
      return;
    }

    if (lastSyncedUnidadeRef.current === unidadeId) {
      return;
    }

    let cancelled = false;

    async function syncCatalog() {
      const existing = inFlightCatalogSync.get(unidadeId);
      if (existing) {
        await existing;
        if (!cancelled) {
          lastSyncedUnidadeRef.current = unidadeId;
        }
        return;
      }

      setCatalogError(null);
      setIsSyncingCatalog(true);

      const promise = (async () => {
        await ensureRecebimentoV2DbReady();
        await updateProductCatalog(unidadeId);
      })();

      inFlightCatalogSync.set(unidadeId, promise);

      try {
        await promise;
        if (!cancelled) {
          lastSyncedUnidadeRef.current = unidadeId;
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogError(
            error instanceof Error ? error.message : 'Falha ao sincronizar catálogo',
          );
        }
      } finally {
        inFlightCatalogSync.delete(unidadeId);
        if (!cancelled) {
          setIsSyncingCatalog(false);
        }
      }
    }

    void syncCatalog();

    return () => {
      cancelled = true;
    };
  }, [isOnline, unidadeId]);

  return useMemo(
    () => ({
      isSyncingCatalog,
      catalogReady,
      catalogError,
    }),
    [catalogError, catalogReady, isSyncingCatalog],
  );
}

export function useProductCatalogSyncRc(): ProductCatalogSyncState {
  return useContext(ProductCatalogSyncContext);
}
