import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { TAREFAS } from '../data/peso-variavel-seed';
import type { Tarefa, TarefaTab } from '../types/peso-variavel.schema';

function matchesTab(tarefa: Tarefa, tab: TarefaTab): boolean {
  if (tab === 'pendentes') {
    return tarefa.status === 'pendente';
  }
  return tarefa.status === 'em_andamento' || tarefa.status === 'express';
}

export function useTarefasAtivas() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TarefaTab>('pendentes');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tabCounts = useMemo(
    () => ({
      pendentes: TAREFAS.filter((t) => matchesTab(t, 'pendentes')).length,
      em_andamento: TAREFAS.filter((t) => matchesTab(t, 'em_andamento')).length,
    }),
    [],
  );

  const stats = useMemo(
    () => ({
      total: TAREFAS.length,
      express: TAREFAS.filter((t) => t.status === 'express').length,
      altoValor: TAREFAS.filter((t) => t.prioridade === 'alto_valor').length,
    }),
    [],
  );

  const filteredTarefas = useMemo(() => {
    const query = search.trim().toLowerCase();
    return TAREFAS.filter((tarefa) => {
      if (!matchesTab(tarefa, activeTab)) return false;
      if (!query) return true;
      return (
        tarefa.pedidoId.toLowerCase().includes(query) ||
        tarefa.zona.toLowerCase().includes(query) ||
        tarefa.descricao.toLowerCase().includes(query)
      );
    });
  }, [search, activeTab]);

  const handleIniciar = useCallback(
    (tarefaId: string) => {
      hapticMedium();
      void navigate({ to: '/peso-variavel/$id', params: { id: tarefaId } });
    },
    [navigate],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    hapticMedium();
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsRefreshing(false);
  }, []);

  return {
    state: {
      search,
      activeTab,
      tabCounts,
      stats,
      filteredTarefas,
      isRefreshing,
    },
    actions: {
      setSearch,
      setActiveTab,
      handleIniciar,
      handleRefresh,
    },
  };
}
