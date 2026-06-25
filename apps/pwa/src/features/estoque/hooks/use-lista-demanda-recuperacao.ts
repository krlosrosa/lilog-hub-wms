import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { SEED_RECUPERACAO_ITENS } from '../data/recuperacao-seed';
import { iniciarDemanda } from '../lib/recuperacao-store';
import type { RecuperacaoDemandaFilter } from '../types/recuperacao.schema';
import { useRecuperacaoDemandas } from './use-recuperacao-store';

const FILTERS: { id: RecuperacaoDemandaFilter; label: string }[] = [
  { id: 'pendente', label: 'Pendentes' },
  { id: 'em_execucao', label: 'Em Execução' },
  { id: 'finalizada', label: 'Finalizadas' },
];

export function useListaDemandaRecuperacao() {
  const navigate = useNavigate();
  const demandas = useRecuperacaoDemandas();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RecuperacaoDemandaFilter>('pendente');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const counts = useMemo(
    () => ({
      pendente: demandas.filter((d) => d.status === 'pendente').length,
      em_execucao: demandas.filter((d) => d.status === 'em_execucao').length,
      finalizada: demandas.filter((d) => d.status === 'finalizada').length,
      all: demandas.length,
    }),
    [demandas],
  );

  const filteredDemands = useMemo(() => {
    const term = search.toLowerCase().trim();
    let list = demandas.filter((d) => d.status === filter);

    if (term) {
      list = list.filter((d) => {
        const matchDemanda =
          d.id.toLowerCase().includes(term) ||
          d.titulo.toLowerCase().includes(term) ||
          d.localizacao.toLowerCase().includes(term);

        const matchSku = SEED_RECUPERACAO_ITENS.some(
          (item) =>
            item.demandaId === d.id &&
            (item.sku.toLowerCase().includes(term) ||
              item.nome.toLowerCase().includes(term)),
        );

        return matchDemanda || matchSku;
      });
    }

    return list;
  }, [demandas, filter, search]);

  const handleIniciar = useCallback(
    (demandaId: string) => {
      hapticMedium();
      iniciarDemanda(demandaId);
      void navigate({
        to: '/estoque/recuperacao/$demandaId',
        params: { demandaId },
      });
    },
    [navigate],
  );

  const handleVer = useCallback(
    (demandaId: string) => {
      hapticMedium();
      void navigate({
        to: '/estoque/recuperacao/$demandaId',
        params: { demandaId },
      });
    },
    [navigate],
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsRefreshing(false);
  }, []);

  return {
    state: {
      search,
      filter,
      filters: FILTERS,
      filteredDemands,
      counts,
      isEmpty: filteredDemands.length === 0,
      isLoading: false,
      isRefreshing,
    },
    actions: {
      setSearch,
      setFilter,
      iniciarDemanda: handleIniciar,
      verDemanda: handleVer,
      refresh,
    },
  };
}
