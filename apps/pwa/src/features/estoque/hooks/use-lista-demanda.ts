import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';
import { db } from '@/lib/offline/db';
import { fetchInventoryDemands } from '@/lib/offline/api-client';
import { useOfflineQuery } from '@/lib/offline/hooks/use-offline-query';

import { SEED_INVENTORY_DEMANDS } from '../data/contagem-seed';
import type {
  InventoryDemand,
  InventoryDemandFilter,
  InventoryDemandType,
} from '../types/estoque.schema';

export { SEED_INVENTORY_DEMANDS as MOCK_INVENTORY_DEMANDS };

const INVENTORY_STATS = {
  activeCount: 12,
};

export function useListaDemanda() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InventoryDemandFilter>('all');
  const [isFinalizing, setIsFinalizing] = useState(false);

  const {
    data: demands,
    isLoading,
    isStale,
    isRefreshing,
    refresh,
  } = useOfflineQuery({
    table: db.inventoryDemands,
    seed: SEED_INVENTORY_DEMANDS,
    fetcher: () => fetchInventoryDemands<InventoryDemand>(),
  });

  const filteredDemands = useMemo(() => {
    const term = search.toLowerCase().trim();
    let list = demands;

    if (filter === 'cega') {
      list = list.filter((d) => d.type === 'cega');
    } else if (filter === 'validacao') {
      list = list.filter((d) => d.type === 'validacao');
    }

    if (term) {
      if (term === 'prioridade' || term === 'prioritário' || term === 'prioritario') {
        list = list.filter((d) => d.isPriority);
      } else {
        list = list.filter(
          (d) =>
            d.id.toLowerCase().includes(term) ||
            d.zone.toLowerCase().includes(term) ||
            d.aisle.toLowerCase().includes(term)
        );
      }
    }

    return [...list].sort((a, b) => {
      const priorityDiff = Number(b.isPriority) - Number(a.isPriority);
      if (priorityDiff !== 0) return priorityDiff;
      return a.id.localeCompare(b.id);
    });
  }, [demands, search, filter]);

  const counts = useMemo(
    () => ({
      all: demands.length,
      cega: demands.filter((d) => d.type === 'cega').length,
      validacao: demands.filter((d) => d.type === 'validacao').length,
      priority: demands.filter((d) => d.isPriority).length,
    }),
    [demands]
  );

  const iniciarDemanda = useCallback(
    (routeId: string, type: InventoryDemandType) => {
      hapticMedium();
      const path =
        type === 'validacao'
          ? '/estoque/contagem/$id/validacao'
          : '/estoque/contagem/$id/cega';
      void navigate({
        to: path,
        params: { id: routeId },
      });
    },
    [navigate]
  );

  const canFinalizar = !isLoading;

  const finalizarContagem = useCallback(async () => {
    if (!canFinalizar || isFinalizing) return;

    setIsFinalizing(true);
    hapticMedium();
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsFinalizing(false);
    void navigate({ to: '/' });
  }, [canFinalizar, isFinalizing, navigate]);

  return {
    state: {
      search,
      filter,
      filteredDemands,
      counts,
      inventoryStats: INVENTORY_STATS,
      isEmpty: !isLoading && filteredDemands.length === 0,
      isLoading,
      isStale,
      isRefreshing,
      canFinalizar,
      isFinalizing,
    },
    actions: {
      setSearch,
      setFilter,
      refresh,
      iniciarDemanda,
      finalizarContagem,
    },
  };
}
