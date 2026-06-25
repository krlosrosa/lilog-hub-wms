'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getInventarioKpi,
  getInventarioTrend,
  listInventarios,
  mapInventarioToListaItem,
} from '@/features/inventario/lib/inventario-api';
import type {
  InventarioKpi,
  InventarioListaItem,
  TrendMes,
} from '@/features/inventario/types/inventario-lista.schema';

const PAGE_SIZE = 4;

const DEFAULT_KPI: InventarioKpi = {
  acuraciaGlobal: 0,
  acuraciaDeltaPercent: 0,
  itensInventariados: 0,
  itensMeta: 0,
  divergenciasTotal: 0,
  divergenciasDelta: 0,
  statusAtualLabel: 'Carregando…',
  tempoEstimadoLabel: null,
};

export function useInventarioOverview() {
  const [busca, setBuscaState] = useState('');
  const [pagina, setPagina] = useState(1);
  const [inventarios, setInventarios] = useState<InventarioListaItem[]>([]);
  const [totalFiltrados, setTotalFiltrados] = useState(0);
  const [kpi, setKpi] = useState<InventarioKpi>(DEFAULT_KPI);
  const [trendMensal, setTrendMensal] = useState<TrendMes[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [lista, kpiData, trend] = await Promise.all([
        listInventarios({
          page: pagina,
          limit: PAGE_SIZE,
          search: busca,
        }),
        getInventarioKpi(),
        getInventarioTrend(),
      ]);

      setInventarios(lista.items.map(mapInventarioToListaItem));
      setTotalFiltrados(lista.total);
      setKpi(kpiData);
      setTrendMensal(trend);
    } finally {
      setCarregando(false);
    }
  }, [busca, pagina]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const totalPaginas = Math.max(1, Math.ceil(totalFiltrados / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const inicio = (paginaSegura - 1) * PAGE_SIZE;

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  return {
    kpi,
    trendMensal,
    inventarios,
    busca,
    setBusca,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    totalFiltrados,
    pageSize: PAGE_SIZE,
    itemsInicio: inicio,
    carregando,
    recarregar: carregar,
  };
}
