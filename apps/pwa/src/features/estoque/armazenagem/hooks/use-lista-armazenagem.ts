import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useUnidade } from '@/features/unidade/lib/unidade-context';
import { hapticMedium } from '@/lib/haptics';

import {
  fetchDemandasArmazenagem,
  type DemandaArmazenagemListItemApi,
} from '../lib/armazenagem-api';
import type { ArmazenagemDemandaFilter } from '../types/armazenagem.schema';

export type ArmazenagemDemandaListItem = {
  id: string;
  routeId: string;
  origem: string;
  zona: string;
  priority: 'urgente' | 'normal';
  isPriority: boolean;
  itemCount: number;
  storedCount: number;
  status: DemandaArmazenagemListItemApi['status'];
};

function mapDemandaToListItem(
  demanda: DemandaArmazenagemListItemApi,
): ArmazenagemDemandaListItem {
  const isUrgente = demanda.status === 'aguardando_inicio';
  return {
    id: demanda.id.slice(0, 8).toUpperCase(),
    routeId: demanda.id,
    origem: `Recebimento ${demanda.recebimentoId.slice(0, 8)}`,
    zona: demanda.modoUnitizacao,
    priority: isUrgente ? 'urgente' : 'normal',
    isPriority: isUrgente,
    itemCount: 0,
    storedCount: 0,
    status: demanda.status,
  };
}

export function useListaArmazenagem() {
  const navigate = useNavigate();
  const { unidadeSelecionada } = useUnidade();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ArmazenagemDemandaFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demandas, setDemandas] = useState<ArmazenagemDemandaListItem[]>([]);

  const load = useCallback(async () => {
    if (!unidadeId) {
      setDemandas([]);
      setIsLoading(false);
      return;
    }

    setError(null);
    try {
      const result = await fetchDemandasArmazenagem(unidadeId);
      const active = result.items.filter(
        (d) => d.status !== 'concluida' && d.status !== 'cancelada',
      );
      setDemandas(active.map(mapDemandaToListItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar demandas');
      setDemandas([]);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredDemandas = useMemo(() => {
    const term = search.toLowerCase().trim();
    let list = demandas;

    if (filter === 'urgente') {
      list = list.filter((d) => d.priority === 'urgente');
    } else if (filter === 'normal') {
      list = list.filter((d) => d.priority === 'normal');
    }

    if (term) {
      list = list.filter(
        (d) =>
          d.id.toLowerCase().includes(term) ||
          d.routeId.toLowerCase().includes(term) ||
          d.origem.toLowerCase().includes(term) ||
          d.zona.toLowerCase().includes(term),
      );
    }

    return list;
  }, [demandas, search, filter]);

  const counts = useMemo(
    () => ({
      all: demandas.length,
      urgente: demandas.filter((d) => d.priority === 'urgente').length,
      normal: demandas.filter((d) => d.priority === 'normal').length,
      priority: demandas.filter((d) => d.isPriority).length,
    }),
    [demandas],
  );

  const stats = useMemo(() => {
    const totalItems = demandas.reduce((sum, d) => sum + d.itemCount, 0);
    const storedItems = demandas.reduce((sum, d) => sum + d.storedCount, 0);
    const pendingItems = totalItems - storedItems;
    const activeCount = demandas.length;

    return { activeCount, totalItems, storedItems, pendingItems };
  }, [demandas]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    hapticMedium();
    await load();
    setIsRefreshing(false);
  }, [load]);

  const iniciarDemanda = useCallback(
    (routeId: string) => {
      hapticMedium();
      void navigate({
        to: '/estoque/armazenagem/$id',
        params: { id: routeId },
      });
    },
    [navigate],
  );

  return {
    state: {
      search,
      filter,
      filteredDemandas,
      counts,
      stats,
      isEmpty: filteredDemandas.length === 0,
      isLoading,
      isRefreshing,
      error,
    },
    actions: {
      setSearch,
      setFilter,
      refresh,
      iniciarDemanda,
    },
  };
}

export type UseListaArmazenagemReturn = ReturnType<typeof useListaArmazenagem>;
