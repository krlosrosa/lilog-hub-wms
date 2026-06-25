import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/lib/auth-context';
import { useUnidade } from '@/features/unidade';
import { db } from '@/lib/offline/db';
import { fetchDemands } from '@/lib/offline/api-client';
import { useNetworkStatus } from '@/lib/offline/hooks/use-network';

import type { Demand } from '../types/recebimento.schema';

const PATIO_STATS = {
  capacityPercent: 68,
  docksInUse: 14,
  totalDocks: 20,
};

export function useListaDemanda() {
  const { isLoading: isAuthLoading } = useAuth();
  const {
    unidadeSelecionada,
    isLoading: isUnidadeLoading,
    error: unidadeError,
  } = useUnidade();
  const { isOnline } = useNetworkStatus();
  const unidadeId = unidadeSelecionada?.id ?? null;
  const [search, setSearch] = useState('');
  const [demands, setDemands] = useState<Demand[]>([]);
  const [isDemandsLoading, setIsDemandsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const canFetchDemands =
    !isAuthLoading && !isUnidadeLoading && Boolean(unidadeId);

  const loadDemands = useCallback(async () => {
    if (!unidadeId) {
      setDemands([]);
      return;
    }

    setIsRefreshing(true);
    setFetchError(null);

    try {
      if (isOnline) {
        const remote = await fetchDemands<Demand>(unidadeId);
        setDemands(remote);
        await db.demands.clear();
        if (remote.length > 0) {
          await db.demands.bulkPut(remote);
        }
        return;
      }

      const cached = await db.demands.toArray();
      setDemands(cached.filter((item) => item.unidadeId === unidadeId));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao carregar demandas';
      setFetchError(message);

      try {
        const cached = await db.demands.toArray();
        const filtered = cached.filter((item) => item.unidadeId === unidadeId);
        if (filtered.length > 0) {
          setDemands(filtered);
        }
      } catch {
        // ignore cache read errors
      }
    } finally {
      setIsRefreshing(false);
      setIsDemandsLoading(false);
    }
  }, [isOnline, unidadeId]);

  useEffect(() => {
    if (!canFetchDemands) {
      setIsDemandsLoading(false);
      setDemands([]);
      return;
    }

    setIsDemandsLoading(true);
    void loadDemands();
  }, [canFetchDemands, loadDemands]);

  const filteredDemands = useMemo(() => {
    const term = search.toLowerCase().trim();
    const aguardando = demands.filter((d) => d.status === 'aguardando');
    const list =
      term === 'prioritário' || term === 'prioritario' || term === 'prioridade'
        ? aguardando.filter((d) => d.isPriority)
        : term
          ? aguardando.filter(
              (d) =>
                d.id.toLowerCase().includes(term) ||
                d.supplier.toLowerCase().includes(term) ||
                d.companies?.some((c) => c.toLowerCase().includes(term))
            )
          : aguardando;

    return [...list].sort((a, b) => {
      const priorityDiff = Number(b.isPriority) - Number(a.isPriority);
      if (priorityDiff !== 0) return priorityDiff;
      return a.arrival.localeCompare(b.arrival);
    });
  }, [demands, search]);

  const isLoading =
    isAuthLoading || isUnidadeLoading || (canFetchDemands && isDemandsLoading);
  const missingUnidadeId =
    !isAuthLoading && !isUnidadeLoading && !unidadeId;

  return {
    state: {
      search,
      filteredDemands,
      patioStats: PATIO_STATS,
      isEmpty: !isLoading && !missingUnidadeId && filteredDemands.length === 0,
      isLoading,
      isStale: !isOnline,
      isRefreshing,
      missingUnidadeId,
      unidadeId,
      unidadeSelecionada,
      unidadeError,
      fetchError,
    },
    actions: {
      setSearch,
      refresh: loadDemands,
    },
  };
}
