'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  deleteCentroOrigem,
  listCentrosOrigem,
  mapCentroOrigemToListaItem,
} from '@/features/centros-origem/lib/centros-origem-api';
import type { CentroOrigemListaItem } from '@/features/centros-origem/types/centro-origem-form.schema';
import { ApiClientError } from '@/lib/api';

const PAGE_SIZE = 10;

export function useCentrosOrigemLista() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<CentroOrigemListaItem[]>([]);
  const [busca, setBuscaState] = useState('');
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = total === 0 ? 0 : (paginaSegura - 1) * PAGE_SIZE + 1;

  const carregar = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await listCentrosOrigem({
        page: paginaSegura,
        limit: PAGE_SIZE,
        search: busca,
      });

      setItems(response.items.map(mapCentroOrigemToListaItem));
      setTotal(response.total);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar os centros de origem';

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [paginaSegura, busca]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const removerCentroOrigem = useCallback(
    async (centro: string) => {
      setIsSubmitting(true);

      try {
        await deleteCentroOrigem(centro);
        toast.success('Centro de origem excluído com sucesso');
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível excluir o centro de origem';

        toast.error(message);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [carregar],
  );

  return {
    isLoading,
    isSubmitting,
    busca,
    setBusca,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    itemsPagina: items,
    itemsInicio,
    totalFiltrados: total,
    pageSize: PAGE_SIZE,
    removerCentroOrigem,
    recarregar: carregar,
  };
}
