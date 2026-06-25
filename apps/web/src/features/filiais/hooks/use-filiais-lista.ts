'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  deleteUnidade,
  listUnidades,
  mapUnidadeToListaItem,
} from '@/features/filiais/lib/unidade-api';
import type {
  FilialListaItem,
  FiltroCluster,
} from '@/features/filiais/types/filial-lista.schema';
import { ApiClientError } from '@/lib/api';

const PAGE_SIZE = 10;

export function useFilialLista() {
  const [filiais, setFiliais] = useState<FilialListaItem[]>([]);
  const [filtroCluster, setFiltroCluster] = useState<FiltroCluster>('todos');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarLista = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const response = await listUnidades({
        page: pagina,
        limit: PAGE_SIZE,
        cluster: filtroCluster,
        search: busca,
      });

      setFiliais(response.items.map(mapUnidadeToListaItem));
      setTotal(response.total);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar as unidades';

      setErro(message);
      toast.error(message);
    } finally {
      setCarregando(false);
    }
  }, [pagina, filtroCluster, busca]);

  useEffect(() => {
    void carregarLista();
  }, [carregarLista]);

  const removerFilial = useCallback(
    async (id: string) => {
      try {
        await deleteUnidade(id);
        toast.success('Unidade removida');
        await carregarLista();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível excluir a unidade';

        toast.error(message);
        throw error;
      }
    },
    [carregarLista],
  );

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = useMemo(() => {
    const porCluster = filiais.reduce(
      (acc, filial) => {
        acc[filial.cluster] = (acc[filial.cluster] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalCentros = filiais.reduce(
      (acc, filial) => acc + filial.centrosCount,
      0,
    );

    return {
      total,
      totalCentros,
      porCluster,
    };
  }, [filiais, total]);

  function handleSetFiltro(cluster: FiltroCluster) {
    setFiltroCluster(cluster);
    setPagina(1);
  }

  function handleSetBusca(value: string) {
    setBusca(value);
    setPagina(1);
  }

  return {
    filtroCluster,
    setFiltroCluster: handleSetFiltro,
    busca,
    setBusca: handleSetBusca,
    pagina,
    setPagina,
    totalPaginas,
    itemsPagina: filiais,
    itemsInicio: total === 0 ? 0 : (pagina - 1) * PAGE_SIZE + 1,
    totalFiltrados: total,
    stats,
    pageSize: PAGE_SIZE,
    removerFilial,
    carregando,
    erro,
    recarregar: carregarLista,
  };
}
