'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  deleteClienteEspecial,
  listClientesEspeciais,
  mapClienteEspecialToListaItem,
} from '@/features/cliente-especial-expedicao/lib/cliente-especial-api';
import type {
  ClienteEspecialListaItem,
  FiltroClienteEspecialAtivo,
} from '@/features/cliente-especial-expedicao/types/cliente-especial.schema';
import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';

const PAGE_SIZE = 10;

export function useClientesEspeciaisLista() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<ClienteEspecialListaItem[]>([]);
  const [busca, setBuscaState] = useState('');
  const [filtroAtivo, setFiltroAtivoState] =
    useState<FiltroClienteEspecialAtivo>('todos');
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [clienteParaExcluir, setClienteParaExcluir] =
    useState<ClienteEspecialListaItem | null>(null);

  const ativoApi =
    filtroAtivo === 'ativos'
      ? true
      : filtroAtivo === 'inativos'
        ? false
        : undefined;

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = total === 0 ? 0 : (paginaSegura - 1) * PAGE_SIZE + 1;

  const carregar = useCallback(async () => {
    if (!unidadeId) {
      setItems([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await listClientesEspeciais({
        unidadeId,
        page: paginaSegura,
        limit: PAGE_SIZE,
        search: busca,
        ativo: ativoApi,
      });

      setItems(response.items.map(mapClienteEspecialToListaItem));
      setTotal(response.total);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar os clientes especiais';

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId, paginaSegura, busca, ativoApi]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const setFiltroAtivo = useCallback((value: FiltroClienteEspecialAtivo) => {
    setFiltroAtivoState(value);
    setPagina(1);
  }, []);

  const confirmarExclusao = useCallback(async () => {
    if (!clienteParaExcluir) {
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteClienteEspecial(clienteParaExcluir.id);
      toast.success('Cliente especial excluído');
      setClienteParaExcluir(null);
      await carregar();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível excluir o cliente especial';

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [clienteParaExcluir, carregar]);

  return {
    unidadeSelecionada,
    isLoading,
    isSubmitting,
    items,
    busca,
    setBusca,
    filtroAtivo,
    setFiltroAtivo,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    itemsInicio,
    totalFiltrados: total,
    pageSize: PAGE_SIZE,
    clienteParaExcluir,
    setClienteParaExcluir,
    confirmarExclusao,
    recarregar: carregar,
  };
}
