import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/lib/auth-context';
import { useUnidade } from '@/features/unidade';
import { db } from '@/lib/offline/db';
import { fetchDemands } from '@/lib/offline/api-client';
import { mergeRemoteDemandWithLocal } from '@/lib/offline/merge-demands-offline';
import { getPendingEntries } from '@/lib/offline/outbox';
import { extractDemandFromOutbox } from '@/lib/offline/sync-export/demand-grouping';
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

    setFetchError(null);

    try {
      const cached = await db.demands.toArray();
      const filtered = cached.filter((item) => item.unidadeId === unidadeId);
      if (filtered.length > 0) {
        setDemands(filtered);
        setIsDemandsLoading(false);
      } else {
        setIsDemandsLoading(true);
      }
    } catch {
      setIsDemandsLoading(true);
    }

    setIsRefreshing(true);

    try {
      if (isOnline) {
        const [remote, existing, pendingEntries, checklistDrafts] =
          await Promise.all([
            fetchDemands<Demand>(unidadeId),
            db.demands.toArray(),
            getPendingEntries(db),
            db.checklistDrafts.toArray(),
          ]);

        const pendingOutboxDemandIds = new Set(
          pendingEntries
            .map((entry) => extractDemandFromOutbox(entry))
            .filter((extracted) => extracted?.module === 'recebimento')
            .map((extracted) => extracted!.demandId),
        );

        for (const draft of checklistDrafts) {
          pendingOutboxDemandIds.add(draft.demandId);
        }

        const existingById = new Map(existing.map((demand) => [demand.id, demand]));
        const merged = remote.map((remoteDemand) =>
          mergeRemoteDemandWithLocal(
            remoteDemand,
            existingById.get(remoteDemand.id),
            pendingOutboxDemandIds.has(remoteDemand.id),
          ),
        );

        setDemands(merged);
        await db.demands.clear();
        if (merged.length > 0) {
          await db.demands.bulkPut(merged);
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

    void loadDemands();
  }, [canFetchDemands, loadDemands]);

  const filteredDemands = useMemo(() => {
    const term = search.toLowerCase().trim();
    const demandasAtivas = demands.filter(
      (d) =>
        d.status === 'liberado_para_conferencia' ||
        d.status === 'em_conferencia',
    );
    const list =
      term === 'prioritário' || term === 'prioritario' || term === 'prioridade'
        ? demandasAtivas.filter((d) => d.isPriority)
        : term
          ? demandasAtivas.filter(
              (d) =>
                d.id.toLowerCase().includes(term) ||
                d.supplier.toLowerCase().includes(term) ||
                d.companies?.some((c) => c.toLowerCase().includes(term))
            )
          : demandasAtivas;

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
