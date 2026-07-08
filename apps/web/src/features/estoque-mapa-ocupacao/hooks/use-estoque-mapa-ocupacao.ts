'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  getEnderecoKpi,
  listEnderecos,
  mapEnderecoToListaItem,
  mapKpiApiToKpi,
} from '@/features/enderecos/lib/endereco-api';
import type {
  EnderecoFiltros,
  EnderecoKpi,
  EnderecoListaItem,
} from '@/features/enderecos/types/enderecos-gestao.schema';
import { normalizeNivel } from '@/features/enderecos/types/enderecos-gestao.schema';
import {
  mapListaItemToPosicaoSelecionada,
  type PosicaoSelecionada,
} from '@/features/estoque-mapa-ocupacao/types';

const PAGE_SIZE = 20;

export const DEFAULT_POSICOES_FILTROS: EnderecoFiltros = {
  zonas: [],
  niveis: [],
  tipos: [],
  status: [],
};

function aplicarFiltrosLocais(
  items: EnderecoListaItem[],
  filtros: EnderecoFiltros,
): EnderecoListaItem[] {
  return items.filter((item) => {
    if (
      filtros.zonas.length > 0 &&
      !filtros.zonas.some(
        (zona) => item.zona.toUpperCase() === zona.toUpperCase(),
      )
    ) {
      return false;
    }

    if (
      filtros.niveis.length > 0 &&
      !filtros.niveis.some(
        (nivel) => normalizeNivel(item.nivel) === normalizeNivel(nivel),
      )
    ) {
      return false;
    }

    if (filtros.tipos.length > 0 && !filtros.tipos.includes(item.tipo)) {
      return false;
    }

    if (filtros.status.length > 0 && !filtros.status.includes(item.status)) {
      return false;
    }

    return true;
  });
}

export function useEstoqueMapaOcupacao() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [posicoes, setPosicoes] = useState<EnderecoListaItem[]>([]);
  const [kpi, setKpi] = useState<EnderecoKpi | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busca, setBuscaState] = useState('');
  const [filtros, setFiltrosState] = useState<EnderecoFiltros>(
    DEFAULT_POSICOES_FILTROS,
  );
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [posicaoSelecionada, setPosicaoSelecionada] =
    useState<PosicaoSelecionada | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const usaFiltroLocal =
    filtros.zonas.length > 0 ||
    filtros.niveis.length > 0 ||
    filtros.tipos.length > 1 ||
    filtros.status.length > 1;

  const statusApi =
    filtros.status.length === 1 ? filtros.status[0] : undefined;
  const tipoApi = filtros.tipos.length === 1 ? filtros.tipos[0] : undefined;

  const carregar = useCallback(async () => {
    if (!unidadeId) {
      setPosicoes([]);
      setKpi(null);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const [listResponse, kpiResponse] = await Promise.all([
        listEnderecos({
          page: usaFiltroLocal ? 1 : pagina,
          limit: usaFiltroLocal ? 500 : PAGE_SIZE,
          status: statusApi,
          tipo: tipoApi,
          search: busca,
          unidadeId,
        }),
        getEnderecoKpi({ unidadeId }),
      ]);

      const items = listResponse.items.map(mapEnderecoToListaItem);
      const filtrados = aplicarFiltrosLocais(items, filtros);

      if (usaFiltroLocal) {
        const inicio = (pagina - 1) * PAGE_SIZE;
        setPosicoes(filtrados.slice(inicio, inicio + PAGE_SIZE));
        setTotal(filtrados.length);
      } else {
        setPosicoes(filtrados);
        setTotal(listResponse.total);
      }

      setKpi(mapKpiApiToKpi(kpiResponse));
    } catch (error) {
      setPosicoes([]);
      setKpi(null);
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar as posições',
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    unidadeId,
    pagina,
    statusApi,
    tipoApi,
    busca,
    filtros,
    usaFiltroLocal,
  ]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = total === 0 ? 0 : (paginaSegura - 1) * PAGE_SIZE + 1;

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const aplicarFiltros = useCallback((next: EnderecoFiltros) => {
    setFiltrosState(next);
    setPagina(1);
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltrosState(DEFAULT_POSICOES_FILTROS);
    setBuscaState('');
    setPagina(1);
  }, []);

  const openPosicao = useCallback((item: EnderecoListaItem) => {
    setPosicaoSelecionada(mapListaItemToPosicaoSelecionada(item));
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setPosicaoSelecionada(null);
    }
  }, []);

  const filtrosAtivos = useMemo(
    () =>
      filtros.zonas.length +
      filtros.niveis.length +
      filtros.tipos.length +
      filtros.status.length +
      (busca.trim() ? 1 : 0),
    [filtros, busca],
  );

  return {
    unidadeId,
    unidadeNome: unidadeSelecionada?.nome,
    posicoes,
    kpi,
    isLoading,
    loadError,
    busca,
    setBusca,
    filtros,
    filtrosAtivos,
    aplicarFiltros,
    limparFiltros,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    totalFiltrados: total,
    itemsInicio,
    pageSize: PAGE_SIZE,
    posicaoSelecionada,
    sheetOpen,
    openPosicao,
    closeSheet,
    recarregar: carregar,
  };
}
