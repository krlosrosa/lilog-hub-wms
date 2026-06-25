'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  MOCK_DEMANDAS,
  MOCK_DOCK_SLOTS,
  MOCK_GESTAO_STATS,
  MOCK_OPERATORS,
} from '@/features/devolucao/mocks/devolucao-mock-data';
import type {
  DemandaFiltroTipo,
  DemandaItem,
} from '@/features/devolucao/types/devolucao-gestao.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useDevolucaoGestao() {
  const [isLoading, setIsLoading] = useState(false);
  const [busca, setBuscaState] = useState('');
  const [filtroTipo, setFiltroTipoState] =
    useState<DemandaFiltroTipo>('todos');
  const [demandas] = useState<DemandaItem[]>(() => [...MOCK_DEMANDAS]);
  const [dockSlots] = useState(() => [...MOCK_DOCK_SLOTS]);
  const [operators] = useState(() => [...MOCK_OPERATORS]);
  const stats = MOCK_GESTAO_STATS;

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
  }, []);

  const setFiltroTipo = useCallback((value: DemandaFiltroTipo) => {
    setFiltroTipoState(value);
  }, []);

  const demandasFiltradas = useMemo(() => {
    let items = demandas;

    if (filtroTipo === 'carregamento') {
      items = items.filter((d) => d.tipo === 'carga');
    } else if (filtroTipo === 'descarregamento') {
      items = items.filter((d) => d.tipo === 'descarga');
    }

    const term = busca.trim().toLowerCase();
    if (term) {
      items = items.filter(
        (d) =>
          d.placa.toLowerCase().includes(term) ||
          d.veiculo.toLowerCase().includes(term) ||
          d.motorista.toLowerCase().includes(term) ||
          d.doca.toLowerCase().includes(term),
      );
    }

    return items;
  }, [demandas, filtroTipo, busca]);

  const criarDemandaUrgente = useCallback(async () => {
    setIsLoading(true);
    await delay(800);
    setIsLoading(false);
    return { success: true as const };
  }, []);

  return {
    isLoading,
    stats,
    demandas: demandasFiltradas,
    dockSlots,
    operators,
    busca,
    setBusca,
    filtroTipo,
    setFiltroTipo,
    criarDemandaUrgente,
  };
}
