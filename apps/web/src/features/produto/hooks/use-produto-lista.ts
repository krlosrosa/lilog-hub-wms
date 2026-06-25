'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  deleteProduto,
  listProdutos,
  mapProdutoToListaItem,
} from '@/features/produto/lib/produto-api';
import {
  countProdutoFiltrosAvancadosAtivos,
  DEFAULT_PRODUTO_FILTROS_AVANCADOS,
  mapProdutoFiltrosAvancadosToApiParams,
  type ProdutoFiltrosAvancados,
} from '@/features/produto/types/produto-filtros';
import type {
  FiltroCategoriaProduto,
  ProdutoCategoria,
  ProdutoListaItem,
} from '@/features/produto/types/produto-lista.schema';
import { ApiClientError } from '@/lib/api';

const DEFAULT_PAGE_SIZE = 20;

export function useProdutoLista() {
  const [produtos, setProdutos] = useState<ProdutoListaItem[]>([]);
  const [filtroCategoria, setFiltroCategoriaState] =
    useState<FiltroCategoriaProduto>('todos');
  const [filtrosAvancados, setFiltrosAvancadosState] =
    useState<ProdutoFiltrosAvancados>(DEFAULT_PRODUTO_FILTROS_AVANCADOS);
  const [busca, setBuscaState] = useState('');
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarLista = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const response = await listProdutos({
        page: pagina,
        limit: pageSize,
        categoria: filtroCategoria,
        search: busca,
        ...mapProdutoFiltrosAvancadosToApiParams(filtrosAvancados),
      });

      setProdutos(response.items.map(mapProdutoToListaItem));
      setTotal(response.total);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar os produtos';

      setErro(message);
      toast.error(message);
    } finally {
      setCarregando(false);
    }
  }, [pagina, pageSize, filtroCategoria, busca, filtrosAvancados]);

  useEffect(() => {
    void carregarLista();
  }, [carregarLista]);

  const removerProduto = useCallback(
    async (id: string) => {
      try {
        await deleteProduto(id);
        toast.success('Produto removido');
        await carregarLista();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível excluir o produto';

        toast.error(message);
        throw error;
      }
    },
    [carregarLista],
  );

  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = total === 0 ? 0 : (paginaSegura - 1) * pageSize;

  const filtrosAvancadosAtivos = useMemo(
    () => countProdutoFiltrosAvancadosAtivos(filtrosAvancados),
    [filtrosAvancados],
  );

  const stats = useMemo(() => {
    const categorias = new Set<ProdutoCategoria>();
    for (const produto of produtos) {
      categorias.add(produto.categoria);
    }

    const aguardandoEan = produtos.filter((produto) => !produto.ean?.trim()).length;

    return {
      totalSkus: total,
      categoriasAtivas: categorias.size,
      aguardandoEan,
      sincronizacaoOk: !erro,
    };
  }, [produtos, total, erro]);

  const setFiltroCategoria = useCallback((filtro: FiltroCategoriaProduto) => {
    setFiltroCategoriaState(filtro);
    setPagina(1);
  }, []);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPagina(1);
  }, []);

  const setFiltrosAvancados = useCallback((filtros: ProdutoFiltrosAvancados) => {
    setFiltrosAvancadosState(filtros);
    setPagina(1);
  }, []);

  const limparFiltrosAvancados = useCallback(() => {
    setFiltrosAvancadosState(DEFAULT_PRODUTO_FILTROS_AVANCADOS);
    setPagina(1);
  }, []);

  return {
    filtroCategoria,
    setFiltroCategoria,
    filtrosAvancados,
    filtrosAvancadosAtivos,
    setFiltrosAvancados,
    limparFiltrosAvancados,
    busca,
    setBusca,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    itemsPagina: produtos,
    itemsInicio,
    totalFiltrados: total,
    stats,
    pageSize,
    setPageSize,
    removerProduto,
    carregando,
    erro,
    recarregar: carregarLista,
  };
}
