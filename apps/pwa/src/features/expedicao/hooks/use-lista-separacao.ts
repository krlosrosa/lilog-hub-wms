import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { SEED_SEPARACAO_ORDERS } from '../data/separacao-seed';
import type { SeparacaoOrder, SeparacaoOrderFilter } from '../types/separacao.schema';

export { SEED_SEPARACAO_ORDERS as MOCK_SEPARACAO_ORDERS };

export function useListaSeparacao() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SeparacaoOrderFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const orders = SEED_SEPARACAO_ORDERS;

  const filteredOrders = useMemo(() => {
    const term = search.toLowerCase().trim();
    let list = orders;

    if (filter === 'urgente') {
      list = list.filter((o) => o.priority === 'urgente');
    } else if (filter === 'normal') {
      list = list.filter((o) => o.priority === 'normal');
    }

    if (term) {
      if (term === 'prioridade' || term === 'prioritário' || term === 'prioritario') {
        list = list.filter((o) => o.isPriority);
      } else {
        list = list.filter(
          (o) =>
            o.id.toLowerCase().includes(term) ||
            o.destino.toLowerCase().includes(term) ||
            o.zona.toLowerCase().includes(term)
        );
      }
    }

    return [...list].sort((a, b) => {
      const priorityDiff = Number(b.isPriority) - Number(a.isPriority);
      if (priorityDiff !== 0) return priorityDiff;
      return a.id.localeCompare(b.id);
    });
  }, [orders, search, filter]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      urgente: orders.filter((o) => o.priority === 'urgente').length,
      normal: orders.filter((o) => o.priority === 'normal').length,
      priority: orders.filter((o) => o.isPriority).length,
    }),
    [orders]
  );

  const stats = useMemo(() => {
    const totalItems = orders.reduce((sum, o) => sum + o.itemCount, 0);
    const pickedItems = orders.reduce((sum, o) => sum + o.pickedCount, 0);
    const pendingItems = totalItems - pickedItems;
    const activeCount = orders.filter((o) => o.pickedCount < o.itemCount).length;

    return { activeCount, totalItems, pickedItems, pendingItems };
  }, [orders]);

  const iniciarOrdem = useCallback(
    (routeId: string) => {
      hapticMedium();
      void navigate({
        to: '/expedicao/separacao/$id',
        params: { id: routeId },
      });
    },
    [navigate]
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    hapticMedium();
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsRefreshing(false);
  }, []);

  return {
    state: {
      search,
      filter,
      filteredOrders,
      counts,
      stats,
      isEmpty: filteredOrders.length === 0,
      isLoading: false,
      isRefreshing,
    },
    actions: {
      setSearch,
      setFilter,
      refresh,
      iniciarOrdem,
    },
  };
}

export type UseListaSeparacaoReturn = ReturnType<typeof useListaSeparacao>;

export type SeparacaoOrderListItem = SeparacaoOrder;
