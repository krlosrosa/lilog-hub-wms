'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';

import { listDemandasArmazenagem } from '../lib/armazenagem-api';
import type { DemandaArmazenagemApi } from '../types/armazenagem.api';

const PAGE_SIZE = 10;

export function useArmazenagemLista() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [demandas, setDemandas] = useState<DemandaArmazenagemApi[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [busca, setBuscaState] = useState('');

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = total === 0 ? 0 : (paginaSegura - 1) * PAGE_SIZE + 1;

  const carregar = useCallback(async () => {
    if (!unidadeId) {
      setDemandas([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await listDemandasArmazenagem({
        unidadeId,
        page: paginaSegura,
        limit: PAGE_SIZE,
      });

      setDemandas(response.items);
      setTotal(response.total);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar as demandas de armazenagem';
      toast.error(message);
      setDemandas([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId, paginaSegura]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const demandasFiltradas = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return demandas;

    return demandas.filter(
      (demanda) =>
        demanda.id.toLowerCase().includes(term) ||
        demanda.recebimentoId.toLowerCase().includes(term) ||
        demanda.status.toLowerCase().includes(term),
    );
  }, [busca, demandas]);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const resumo = useMemo(
    () => ({
      total,
      aguardando: demandas.filter((d) => d.status === 'aguardando_inicio').length,
      emAndamento: demandas.filter((d) => d.status === 'em_andamento').length,
      concluidas: demandas.filter((d) => d.status === 'concluida').length,
    }),
    [demandas, total],
  );

  return {
    unidadeId,
    isLoading,
    demandas: demandasFiltradas,
    busca,
    setBusca,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    total,
    itemsInicio,
    pageSize: PAGE_SIZE,
    resumo,
    recarregar: carregar,
  };
}
