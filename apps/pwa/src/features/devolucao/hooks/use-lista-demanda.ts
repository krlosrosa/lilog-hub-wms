import { useMemo, useState } from 'react';

import { useUnidade } from '@/features/unidade';
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

function isDemandaVisivelPwa(demand: Demand): boolean {
  return demand.status === 'aguardando' || demand.status === 'em_conferencia';
}

export function useListaDemanda() {
  const [search, setSearch] = useState('');
  const { unidadeSelecionada, isLoading: isUnidadeLoading } = useUnidade();
  const unidadeId = unidadeSelecionada?.id ?? '';

  const {
    data: demands,
    isLoading: isQueryLoading,
    isStale,
    isRefreshing,
    refresh,
  } = useOfflineQuery({
    table: db.devolucaoDemands,
    seed: SEED_DEMANDS,
    enabled: Boolean(unidadeId),
    fetcher: () => fetchDevolucaoDemands<Demand>(unidadeId),
  });

  const openDemands = useMemo(
    () => demands.filter(isDemandaVisivelPwa),
    [demands],
  );

  const filteredDemands = useMemo(() => {
    const term = search.toLowerCase().trim();
    const list =
      term === 'prioritário' || term === 'prioritario' || term === 'prioridade'
        ? openDemands.filter((d) => d.isPriority)
        : term === 'segregada' ||
            term === 'segregadas' ||
            term === 'carga segregada'
          ? openDemands.filter((d) => d.cargaSegregada)
          : term
            ? openDemands.filter(
                (d) =>
                  d.id.toLowerCase().includes(term) ||
                  d.supplier.toLowerCase().includes(term) ||
                  d.companies?.some((c) => c.toLowerCase().includes(term))
              )
            : openDemands;

    return [...list].sort((a, b) => {
      const priorityDiff = Number(b.isPriority) - Number(a.isPriority);
      if (priorityDiff !== 0) return priorityDiff;
      const segregadaDiff = Number(b.cargaSegregada) - Number(a.cargaSegregada);
      if (segregadaDiff !== 0) return segregadaDiff;
      return a.arrival.localeCompare(b.arrival);
    });
  }, [openDemands, search]);

  const isLoading =
    isUnidadeLoading || (Boolean(unidadeId) && isQueryLoading);

  return {
    state: {
      search,
      filteredDemands,
      patioStats: PATIO_STATS,
      isEmpty: !isLoading && filteredDemands.length === 0,
      isLoading,
      isStale,
      isRefreshing,
      missingUnidadeId: !isUnidadeLoading && !unidadeId,
    },
    actions: {
      setSearch,
      refresh,
    },
  };
}
