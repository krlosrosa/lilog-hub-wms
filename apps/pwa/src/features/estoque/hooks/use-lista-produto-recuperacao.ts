import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { iniciarItem } from '../lib/recuperacao-store';
import type { RecuperacaoItemStatus } from '../types/recuperacao.schema';
import {
  useRecuperacaoDemanda,
  useRecuperacaoItens,
} from './use-recuperacao-store';

export type RecuperacaoItemFilter = 'todos' | RecuperacaoItemStatus;

const ITEM_FILTERS: { id: RecuperacaoItemFilter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendente', label: 'Pendentes' },
  { id: 'em_execucao', label: 'Em execução' },
  { id: 'concluido', label: 'Concluídos' },
];

export function useListaProdutoRecuperacao(demandaId: string) {
  const navigate = useNavigate();
  const demanda = useRecuperacaoDemanda(demandaId);
  const itens = useRecuperacaoItens(demandaId);
  const [search, setSearch] = useState('');
  const [itemFilter, setItemFilter] = useState<RecuperacaoItemFilter>('todos');

  const counts = useMemo(
    () => ({
      todos: itens.length,
      pendente: itens.filter((i) => i.status === 'pendente').length,
      em_execucao: itens.filter((i) => i.status === 'em_execucao').length,
      concluido: itens.filter((i) => i.status === 'concluido').length,
    }),
    [itens],
  );

  const filteredItens = useMemo(() => {
    const term = search.toLowerCase().trim();
    return itens.filter((item) => {
      const matchesFilter =
        itemFilter === 'todos' || item.status === itemFilter;
      if (!matchesFilter) return false;
      if (!term) return true;
      return (
        item.sku.toLowerCase().includes(term) ||
        item.nome.toLowerCase().includes(term) ||
        item.motivoAvaria.toLowerCase().includes(term)
      );
    });
  }, [itens, search, itemFilter]);

  const pendentes = useMemo(
    () => itens.filter((i) => i.status !== 'concluido').length,
    [itens],
  );

  const concluidos = counts.concluido;

  const progressPercent = useMemo(() => {
    if (itens.length === 0) return 0;
    return Math.round((concluidos / itens.length) * 100);
  }, [itens.length, concluidos]);

  const handleIniciarItem = useCallback(
    (itemId: string) => {
      hapticMedium();
      iniciarItem(demandaId, itemId);
      void navigate({
        to: '/estoque/recuperacao/$demandaId/$itemId/detalhe',
        params: { demandaId, itemId },
      });
    },
    [demandaId, navigate],
  );

  const handleVerDetalhe = useCallback(
    (itemId: string) => {
      hapticMedium();
      void navigate({
        to: '/estoque/recuperacao/$demandaId/$itemId/detalhe',
        params: { demandaId, itemId },
      });
    },
    [demandaId, navigate],
  );

  const handleVerResumo = useCallback(() => {
    if (demanda?.status !== 'finalizada') return;
    hapticMedium();
    void navigate({
      to: '/estoque/recuperacao/$demandaId/resumo',
      params: { demandaId },
    });
  }, [demanda?.status, demandaId, navigate]);

  return {
    state: {
      demanda,
      itens: filteredItens,
      search,
      itemFilter,
      itemFilters: ITEM_FILTERS,
      counts,
      isEmpty: filteredItens.length === 0,
      pendentes,
      concluidos,
      progressPercent,
      totalItens: itens.length,
    },
    actions: {
      setSearch,
      setItemFilter,
      iniciarItem: handleIniciarItem,
      verDetalhe: handleVerDetalhe,
      verResumo: handleVerResumo,
    },
  };
}
