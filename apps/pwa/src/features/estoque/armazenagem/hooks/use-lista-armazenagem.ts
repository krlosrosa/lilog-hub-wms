import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useUnidade } from '@/features/unidade/lib/unidade-context';
import { hapticMedium } from '@/lib/haptics';

import {
  fetchDemandaArmazenagem,
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
  stats?: { itemCount: number; storedCount: number },
): ArmazenagemDemandaListItem {
  const isUrgente = demanda.status === 'aguardando_inicio';
  return {
    id: demanda.id.slice(0, 8).toUpperCase(),
    routeId: demanda.id,
    origem: `Recebimento ${demanda.recebimentoId.slice(0, 8)}`,
    zona: demanda.modoUnitizacao,
    priority: isUrgente ? 'urgente' : 'normal',
    isPriority: isUrgente,
    itemCount: stats?.itemCount ?? 0,
    storedCount: stats?.storedCount ?? 0,
    status: demanda.status,
  };
}

async function resolveDemandaStats(demandaId: string) {
  const detail = await fetchDemandaArmazenagem(demandaId);

  if (detail.tarefas && detail.tarefas.length > 0) {
    return {
      itemCount: detail.tarefas.length,
      storedCount: detail.tarefas.filter((tarefa) => tarefa.status === 'armazenada')
        .length,
    };
  }

  return {
    itemCount: detail.itens.length,
    storedCount: detail.itens.filter((item) => item.status === 'armazenado').length,
  };
}

export function useListaArmazenagem(options?: {
  detalhePath?: string;
  filterMode?: 'all' | 'armazenagem' | 'ressuprimento';
}) {
  const detalhePath = options?.detalhePath ?? '/movimentacao/armazenagem/$id';
  const filterMode = options?.filterMode ?? 'all';
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
      let active = result.items.filter(
        (d) =>
          d.status !== 'concluida' &&
          d.status !== 'cancelada' &&
          d.status !== 'aguardando_validacao',
      );

      if (filterMode === 'armazenagem') {
        const filtered = active.filter(
          (demanda) => demanda.modoUnitizacao === 'gerar_etiqueta_na_armazenagem',
        );
        if (filtered.length > 0) active = filtered;
      } else if (filterMode === 'ressuprimento') {
        const filtered = active.filter(
          (demanda) => demanda.modoUnitizacao !== 'gerar_etiqueta_na_armazenagem',
        );
        if (filtered.length > 0) active = filtered;
      }

      const enriched = await Promise.all(
        active.map(async (demanda) => {
          try {
            const stats = await resolveDemandaStats(demanda.id);
            return mapDemandaToListItem(demanda, stats);
          } catch {
            return mapDemandaToListItem(demanda);
          }
        }),
      );

      setDemandas(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar demandas');
      setDemandas([]);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId, filterMode]);

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
        to: detalhePath,
        params: { id: routeId },
      });
    },
    [navigate, detalhePath],
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
