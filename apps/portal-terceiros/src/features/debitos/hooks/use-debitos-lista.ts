'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { listarDebitos } from '../lib/debitos-api';
import type {
  DebitoFiltroStatus,
  ProcessoDebitoListItem,
  ProcessoDebitoStatus,
} from '../types/debito.types';

const STATUS_POR_FILTRO: Record<
  Exclude<DebitoFiltroStatus, 'todos' | 'encerrados'>,
  ProcessoDebitoStatus
> = {
  abertos: 'aberto',
  em_analise: 'em_analise',
};

const STATUS_ENCERRADOS: ProcessoDebitoStatus[] = [
  'aprovado',
  'incluido_em_documento',
  'cancelado',
];

export function useDebitosLista() {
  const [filtro, setFiltro] = useState<DebitoFiltroStatus>('abertos');
  const [processos, setProcessos] = useState<ProcessoDebitoListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (filtro === 'encerrados') {
        const resultados = await Promise.all(
          STATUS_ENCERRADOS.map((status) => listarDebitos({ status })),
        );
        setProcessos(resultados.flat());
        return;
      }

      if (filtro === 'todos') {
        const todos = await listarDebitos();
        setProcessos(todos);
        return;
      }

      const status = STATUS_POR_FILTRO[filtro];
      const lista = await listarDebitos({ status });
      setProcessos(lista);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar débitos',
      );
      setProcessos([]);
    } finally {
      setIsLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const processosOrdenados = useMemo(
    () =>
      [...processos].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [processos],
  );

  return {
    filtro,
    setFiltro,
    processos: processosOrdenados,
    isLoading,
    error,
    recarregar: carregar,
  };
}
