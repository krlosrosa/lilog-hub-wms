import type { Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useRef, useState } from 'react';

import { isApiConfigured } from '../api-client';
import { useNetworkStatus } from './use-network';

export interface UseOfflineQueryOptions<T, TKey> {
  table: Table<T, TKey>;
  fetcher: () => Promise<T[]>;
  seed?: T[];
  enabled?: boolean;
}

export function useOfflineQuery<T, TKey>({
  table,
  fetcher,
  seed,
  enabled = true,
}: UseOfflineQueryOptions<T, TKey>) {
  const { isOnline } = useNetworkStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);

  fetcherRef.current = fetcher;

  const data = useLiveQuery(() => table.toArray(), [table]);

  const seedLocal = useCallback(async () => {
    if (isApiConfigured() || !seed?.length) return;
    const count = await table.count();
    if (count === 0) {
      await table.bulkPut(seed);
    }
  }, [seed, table]);

  const refreshFromRemote = useCallback(async () => {
    if (!enabled || !isOnline) return;

    setIsRefreshing(true);
    setFetchError(null);

    try {
      const remote = await fetcherRef.current();
      if (remote.length > 0 || isApiConfigured()) {
        await table.clear();
        if (remote.length > 0) {
          await table.bulkPut(remote);
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao atualizar dados';
      setFetchError(message);
    } finally {
      setIsRefreshing(false);
    }
  }, [enabled, isOnline, table]);

  useEffect(() => {
    void seedLocal();
  }, [seedLocal]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void refreshFromRemote();
  }, [enabled, refreshFromRemote]);

  return {
    data: data ?? [],
    isLoading: enabled ? data === undefined : false,
    isRefreshing,
    isStale: !isOnline,
    fetchError,
    refresh: refreshFromRemote,
  };
}
