import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchDemandasArmazenagem } from '@/features/estoque/armazenagem/lib/armazenagem-api';
import { useUnidade } from '@/features/unidade/lib/unidade-context';
import { hapticMedium } from '@/lib/haptics';

import { mapDemandaListToTarefa } from '../lib/map-tarefa-armazenagem';
import type { PrioridadeFilter, Tarefa } from '../types/movimentacao.schema';

export function useListaTarefas() {
  const navigate = useNavigate();
  const { unidadeSelecionada } = useUnidade();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PrioridadeFilter>('todas');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);

  const load = useCallback(async () => {
    if (!unidadeId) {
      setTarefas([]);
      setIsLoading(false);
      return;
    }

    setError(null);
    try {
      const result = await fetchDemandasArmazenagem(unidadeId);
      const active = result.items.filter(
        (d) => d.status !== 'concluida' && d.status !== 'cancelada',
      );
      setTarefas(active.map(mapDemandaListToTarefa));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar tarefas');
      setTarefas([]);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredTarefas = useMemo(() => {
    const term = search.toLowerCase().trim();
    let list = tarefas;

    if (filter !== 'todas') {
      list = list.filter((t) => t.prioridade === filter);
    }

    if (term) {
      list = list.filter(
        (t) =>
          t.taskId.toLowerCase().includes(term) ||
          t.id.toLowerCase().includes(term) ||
          t.origem.toLowerCase().includes(term) ||
          t.item.toLowerCase().includes(term),
      );
    }

    const priorityOrder = { alta: 0, media: 1, baixa: 2 };
    return [...list].sort(
      (a, b) => priorityOrder[a.prioridade] - priorityOrder[b.prioridade],
    );
  }, [search, filter, tarefas]);

  const counts = useMemo(
    () => ({
      todas: tarefas.length,
      alta: tarefas.filter((t) => t.prioridade === 'alta').length,
      media: tarefas.filter((t) => t.prioridade === 'media').length,
      baixa: tarefas.filter((t) => t.prioridade === 'baixa').length,
    }),
    [tarefas],
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    hapticMedium();
    await load();
    setIsRefreshing(false);
  }, [load]);

  const iniciarTarefa = useCallback(
    (id: string) => {
      hapticMedium();
      void navigate({
        to: '/estoque/armazenagem/$id',
        params: { id },
      });
    },
    [navigate],
  );

  return {
    state: {
      search,
      filter,
      filteredTarefas,
      counts,
      isEmpty: !isLoading && filteredTarefas.length === 0,
      isLoading,
      isRefreshing,
      error,
    },
    actions: {
      setSearch,
      setFilter,
      refresh,
      iniciarTarefa,
    },
  };
}
