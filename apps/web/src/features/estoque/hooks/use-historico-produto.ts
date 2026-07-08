'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  fetchHistoricoProduto,
  mapHistoricoMovimentacaoItem,
} from '@/features/estoque/lib/estoque-api';
import type {
  HistoricoMovimentacaoItem,
  HistoricoProdutoSelecionado,
} from '@/features/estoque/types/estoque-gestao.schema';
import { ApiClientError } from '@/lib/api';

const PAGE_SIZE = 20;

export function useHistoricoProduto(
  produtoSelecionado: HistoricoProdutoSelecionado | null,
) {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [itens, setItens] = useState<HistoricoMovimentacaoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const carregarPagina = useCallback(
    async (page: number, append: boolean) => {
      if (!unidadeId || !produtoSelecionado) {
        return;
      }

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await fetchHistoricoProduto({
          unidadeId,
          produtoId: produtoSelecionado.produtoId,
          lote: produtoSelecionado.lote || undefined,
          depositoId: produtoSelecionado.depositoId,
          enderecoId: produtoSelecionado.enderecoId,
          page,
          limit: PAGE_SIZE,
        });

        const mapped = response.items.map(mapHistoricoMovimentacaoItem);

        setItens((prev) => (append ? [...prev, ...mapped] : mapped));
        setTotal(response.total);
        setPagina(page);
        setHasMore(page * PAGE_SIZE < response.total);
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Erro ao carregar histórico do produto';
        toast.error(message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [produtoSelecionado, unidadeId],
  );

  useEffect(() => {
    if (!produtoSelecionado || !unidadeId) {
      setItens([]);
      setTotal(0);
      setPagina(1);
      setHasMore(false);
      return;
    }

    void carregarPagina(1, false);
  }, [carregarPagina, produtoSelecionado, unidadeId]);

  const carregarMais = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading) {
      return;
    }

    void carregarPagina(pagina + 1, true);
  }, [carregarPagina, hasMore, isLoading, isLoadingMore, pagina]);

  return {
    isLoading,
    isLoadingMore,
    itens,
    total,
    hasMore,
    carregarMais,
  };
}
