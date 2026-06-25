'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { listCortesOperacionais } from '@/features/corte-operacional/lib/corte-operacional-api';
import type {
  CorteListaItem,
  CorteStatus,
  FiltroCorteStatus,
} from '@/features/corte-operacional/types/corte-operacional.schema';
import { ApiClientError } from '@/lib/api';

const PAGE_SIZE = 20;

export function useCorteOperacionalLista() {
  const { unidadeSelecionada, isResolved } = useUnidadeContext();
  const [items, setItems] = useState<CorteListaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [busca, setBuscaState] = useState('');
  const [filtroStatus, setFiltroStatusState] =
    useState<FiltroCorteStatus>('todos');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!unidadeSelecionada) {
      setItems([]);
      setTotal(0);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const response = await listCortesOperacionais({
        unidadeId: unidadeSelecionada.id,
        page,
        limit: PAGE_SIZE,
        status:
          filtroStatus === 'todos'
            ? undefined
            : (filtroStatus as CorteStatus),
        search: busca,
      });

      setItems(response.items);
      setTotal(response.total);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Erro ao carregar cortes operacionais';
      setErro(message);
      toast.error(message);
    } finally {
      setCarregando(false);
    }
  }, [unidadeSelecionada, page, filtroStatus, busca]);

  useEffect(() => {
    if (!isResolved) return;
    void carregar();
  }, [isResolved, carregar]);

  const setBusca = useCallback((value: string) => {
    setPage(1);
    setBuscaState(value);
  }, []);

  const setFiltroStatus = useCallback((value: FiltroCorteStatus) => {
    setPage(1);
    setFiltroStatusState(value);
  }, []);

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    setPage,
    busca,
    setBusca,
    filtroStatus,
    setFiltroStatus,
    carregando,
    erro,
    recarregar: carregar,
    unidadeNome: unidadeSelecionada?.nome ?? null,
    unidadeId: unidadeSelecionada?.id ?? null,
  };
}
