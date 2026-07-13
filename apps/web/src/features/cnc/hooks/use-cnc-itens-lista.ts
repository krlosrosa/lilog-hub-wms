'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { listarCncItens } from '@/features/cnc/lib/cnc-api';
import {
  getDefaultCncItensFiltros,
  mapCncItensFiltrosToApiParams,
  normalizeCncItensFiltros,
  type CncItensFiltros,
} from '@/features/cnc/types/cnc-itens-filtros';
import type { CncItemListado } from '@/features/cnc/types/cnc.schema';

const PAGE_SIZE = 20;

export function useCncItensLista() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [itens, setItens] = useState<CncItemListado[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filtros, setFiltrosState] = useState<CncItensFiltros>(
    getDefaultCncItensFiltros,
  );
  const [pagina, setPagina] = useState(1);

  const carregarDados = useCallback(async () => {
    if (!unidadeId) {
      setItens([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const filtrosNormalizados = normalizeCncItensFiltros(filtros);
      const apiParams = mapCncItensFiltrosToApiParams(filtrosNormalizados);
      const response = await listarCncItens(unidadeId, {
        page: pagina,
        limit: PAGE_SIZE,
        ...apiParams,
      });

      setItens(response.items);
      setTotal(response.total);
    } catch (error) {
      setItens([]);
      setTotal(0);

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os itens de CNC.';

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId, filtros, pagina]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = (paginaSegura - 1) * PAGE_SIZE;

  const setFiltros = useCallback((value: CncItensFiltros) => {
    setFiltrosState(normalizeCncItensFiltros(value));
    setPagina(1);
  }, []);

  const setPaginaSegura = useCallback((value: number) => {
    setPagina(value);
  }, []);

  return {
    itens,
    total,
    filtros,
    setFiltros,
    pagina: paginaSegura,
    setPagina: setPaginaSegura,
    totalPaginas,
    itemsInicio,
    pageSize: PAGE_SIZE,
    isLoading,
    recarregar: carregarDados,
  };
}
