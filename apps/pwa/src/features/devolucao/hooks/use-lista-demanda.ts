import { useMemo, useState } from 'react';

import { db } from '@/lib/offline/db';
import { fetchDevolucaoDemands } from '@/lib/offline/api-client';
import { useOfflineQuery } from '@/lib/offline/hooks/use-offline-query';

import { SEED_DEMANDS } from '../data/devolucao-seed';
import type { Demand } from '../types/devolucao.schema';

export { SEED_DEMANDS as MOCK_DEMANDS };

const PATIO_STATS = {
  capacityPercent: 68,
  docksInUse: 14,
  totalDocks: 20,
};

export function useListaDemanda() {
  const [search, setSearch] = useState('');

  const {
    data: demands,
    isLoading,
    isStale,
    isRefreshing,
    refresh,
  } = useOfflineQuery({
    table: db.devolucaoDemands,
    seed: SEED_DEMANDS,
    fetcher: () => fetchDevolucaoDemands<Demand>(),
  });

  const filteredDemands = useMemo(() => {
    const term = search.toLowerCase().trim();
    const list =
      term === 'prioritário' || term === 'prioritario' || term === 'prioridade'
        ? demands.filter((d) => d.isPriority)
        : term === 'segregada' ||
            term === 'segregadas' ||
            term === 'carga segregada'
          ? demands.filter((d) => d.cargaSegregada)
          : term
            ? demands.filter(
                (d) =>
                  d.id.toLowerCase().includes(term) ||
                  d.supplier.toLowerCase().includes(term) ||
                  d.companies?.some((c) => c.toLowerCase().includes(term))
              )
            : demands;

    return [...list].sort((a, b) => {
      const priorityDiff = Number(b.isPriority) - Number(a.isPriority);
      if (priorityDiff !== 0) return priorityDiff;
      const segregadaDiff = Number(b.cargaSegregada) - Number(a.cargaSegregada);
      if (segregadaDiff !== 0) return segregadaDiff;
      return a.arrival.localeCompare(b.arrival);
    });
  }, [demands, search]);

  return {
    state: {
      search,
      filteredDemands,
      patioStats: PATIO_STATS,
      isEmpty: !isLoading && filteredDemands.length === 0,
      isLoading,
      isStale,
      isRefreshing,
    },
    actions: {
      setSearch,
      refresh,
    },
  };
}
