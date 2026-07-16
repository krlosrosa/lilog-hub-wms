import { useCallback, useEffect, useState } from 'react';

import {
  clearAllServiceWorkerCaches,
  clearDemandIndexedDbData,
  clearFullIndexedDb,
  clearServiceWorkerCache,
  readCacheManagerSnapshot,
  type CacheManagerSnapshot,
} from '../lib/cache-manager.service';

interface UseCacheManagerResult {
  snapshot: CacheManagerSnapshot | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isClearing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  clearSwCache: (cacheName: string) => Promise<void>;
  clearAllSwCaches: () => Promise<void>;
  clearDemandData: () => Promise<void>;
  clearFullDatabase: () => Promise<void>;
}

export function useCacheManager(demandId: string): UseCacheManagerResult {
  const [snapshot, setSnapshot] = useState<CacheManagerSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const nextSnapshot = await readCacheManagerSnapshot(demandId);
      setSnapshot(nextSnapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ler informações de cache');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [demandId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runClearAction = useCallback(
    async (action: () => Promise<void>) => {
      setIsClearing(true);
      setError(null);

      try {
        await action();
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao limpar cache');
        throw err;
      } finally {
        setIsClearing(false);
      }
    },
    [refresh],
  );

  const clearSwCache = useCallback(
    async (cacheName: string) => {
      await runClearAction(() => clearServiceWorkerCache(cacheName));
    },
    [runClearAction],
  );

  const clearAllSwCaches = useCallback(async () => {
    await runClearAction(() => clearAllServiceWorkerCaches());
  }, [runClearAction]);

  const clearDemandData = useCallback(async () => {
    await runClearAction(() => clearDemandIndexedDbData(demandId));
  }, [demandId, runClearAction]);

  const clearFullDatabase = useCallback(async () => {
    await runClearAction(() => clearFullIndexedDb());
  }, [runClearAction]);

  return {
    snapshot,
    isLoading,
    isRefreshing,
    isClearing,
    error,
    refresh,
    clearSwCache,
    clearAllSwCaches,
    clearDemandData,
    clearFullDatabase,
  };
}
