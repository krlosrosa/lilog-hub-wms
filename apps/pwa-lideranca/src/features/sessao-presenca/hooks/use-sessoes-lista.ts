import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useUnidade } from '@/features/unidade';

import { listSessoes } from '../api';
import { sortSessoesByPriority } from '../lib/presenca-stats';
import { todayReference } from '../lib/sessao-labels';
import type { FeatureToast, SessaoApi, SessaoStatusFiltro } from '../types';

const TOAST_DURATION_MS = 2500;

export function useSessoesLista() {
  const {
    unidadeSelecionada,
    isLoading: isUnidadeLoading,
    error: unidadeError,
  } = useUnidade();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [dataReferenciaInicio, setDataReferenciaInicio] =
    useState(todayReference);
  const [dataReferenciaFim, setDataReferenciaFim] = useState(todayReference);
  const [statusFiltro, setStatusFiltro] = useState<SessaoStatusFiltro>('todos');
  const [sessoes, setSessoes] = useState<SessaoApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toast, setToast] = useState<FeatureToast | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, variant: FeatureToast['variant']) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setToast({ message, variant });
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, TOAST_DURATION_MS);
    },
    [],
  );

  const loadSessoes = useCallback(async () => {
    if (!unidadeId) {
      setSessoes([]);
      setIsLoading(false);
      return;
    }

    setIsRefreshing(true);
    setFetchError(null);

    try {
      const response = await listSessoes({
        unidadeId,
        dataReferenciaInicio,
        dataReferenciaFim,
        status: statusFiltro === 'todos' ? undefined : statusFiltro,
        limit: 50,
      });
      setSessoes(sortSessoesByPriority(response.items));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao carregar sessões';
      setFetchError(message);
      setSessoes([]);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [dataReferenciaFim, dataReferenciaInicio, statusFiltro, unidadeId]);

  useEffect(() => {
    if (isUnidadeLoading) return;

    setIsLoading(true);
    void loadSessoes();
  }, [isUnidadeLoading, loadSessoes]);

  const sessaoAberta = useMemo(
    () => sessoes.find((s) => s.status === 'aberta') ?? null,
    [sessoes],
  );

  const filteredSessoes = useMemo(() => {
    if (!sessaoAberta) return sessoes;
    return [
      sessaoAberta,
      ...sessoes.filter((s) => s.id !== sessaoAberta.id),
    ];
  }, [sessaoAberta, sessoes]);

  return {
    state: {
      unidadeId,
      unidadeSelecionada,
      unidadeError,
      dataReferenciaInicio,
      dataReferenciaFim,
      statusFiltro,
      sessoes: filteredSessoes,
      sessaoAberta,
      isLoading: isUnidadeLoading || isLoading,
      isRefreshing,
      fetchError,
      missingUnidadeId: !isUnidadeLoading && !unidadeId,
      isEmpty: !isLoading && Boolean(unidadeId) && sessoes.length === 0,
      toast,
    },
    actions: {
      setDataReferenciaInicio,
      setDataReferenciaFim,
      setStatusFiltro,
      refresh: loadSessoes,
      showToast,
      dismissToast,
    },
  };
}
