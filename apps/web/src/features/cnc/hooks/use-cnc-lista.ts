'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  computeCncKpi,
  listarCncs,
  mapCncApiToListItem,
} from '@/features/cnc/lib/cnc-api';
import type {
  CncKpi,
  CncListItem,
  FiltroSituacaoCnc,
} from '@/features/cnc/types/cnc.schema';

const PAGE_SIZE = 10;

const EMPTY_KPI: CncKpi = {
  total: 0,
  pendentes: 0,
  emAnalise: 0,
  encerradas: 0,
  canceladas: 0,
};

function filtrarPorSituacao(
  items: CncListItem[],
  filtro: FiltroSituacaoCnc,
): CncListItem[] {
  if (filtro === 'todos') {
    return items;
  }

  return items.filter((item) => item.situacao === filtro);
}

export function useCncLista() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [cncs, setCncs] = useState<CncListItem[]>([]);
  const [kpi, setKpi] = useState<CncKpi>(EMPTY_KPI);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBuscaState] = useState('');
  const [filtroSituacao, setFiltroSituacaoState] =
    useState<FiltroSituacaoCnc>('todos');
  const [pagina, setPagina] = useState(1);

  const carregarDados = useCallback(async () => {
    if (!unidadeId) {
      setCncs([]);
      setKpi(EMPTY_KPI);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await listarCncs(unidadeId, { page: 1, limit: 100 });
      const items = response.items.map(mapCncApiToListItem);

      setCncs(items);
      setKpi(computeCncKpi(items));
    } catch (error) {
      setCncs([]);
      setKpi(EMPTY_KPI);

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar as não conformidades.';

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const filtrados = useMemo(() => {
    let items = cncs;

    items = filtrarPorSituacao(items, filtroSituacao);

    const term = busca.trim().toLowerCase();
    if (term) {
      items = items.filter(
        (item) =>
          item.numero.toLowerCase().includes(term) ||
          (item.descricao?.toLowerCase().includes(term) ?? false),
      );
    }

    return items;
  }, [cncs, filtroSituacao, busca]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = (paginaSegura - 1) * PAGE_SIZE;
  const itemsPagina = filtrados.slice(itemsInicio, itemsInicio + PAGE_SIZE);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const setFiltroSituacao = useCallback((value: FiltroSituacaoCnc) => {
    setFiltroSituacaoState(value);
    setPagina(1);
  }, []);

  return {
    kpi,
    busca,
    setBusca,
    filtroSituacao,
    setFiltroSituacao,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados: filtrados.length,
    totalRegistros: cncs.length,
    pageSize: PAGE_SIZE,
    isLoading,
    recarregar: carregarDados,
  };
}
