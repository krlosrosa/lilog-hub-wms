'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { listSessoes } from '@/features/sessao-operacao/lib/sessao-operacao-api';
import type {
  SessaoApi,
  SessaoTrabalhoStatusApi,
} from '@/features/sessao-operacao/types/sessao.api';

const PAGE_SIZE = 20;

function todayReference(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useSessoesGestao() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [sessoes, setSessoes] = useState<SessaoApi[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [dataReferencia, setDataReferencia] = useState(todayReference());
  const [statusFiltro, setStatusFiltro] = useState<SessaoTrabalhoStatusApi | 'todos'>(
    'todos',
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadSessoes = useCallback(async () => {
    if (!unidadeId) {
      setSessoes([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await listSessoes({
        unidadeId,
        page: pagina,
        limit: PAGE_SIZE,
        dataReferencia,
        status: statusFiltro === 'todos' ? undefined : statusFiltro,
      });
      setSessoes(response.items);
      setTotal(response.total);
    } catch {
      toast.error('Não foi possível carregar as sessões.');
      setSessoes([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [dataReferencia, pagina, statusFiltro, unidadeId]);

  useEffect(() => {
    void loadSessoes();
  }, [loadSessoes]);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    unidadeId,
    sessoes,
    total,
    pagina,
    setPagina,
    totalPaginas,
    dataReferencia,
    setDataReferencia,
    statusFiltro,
    setStatusFiltro,
    isLoading,
    reloadSessoes: loadSessoes,
  };
}
