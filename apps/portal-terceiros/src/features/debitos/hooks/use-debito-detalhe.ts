'use client';

import { useCallback, useEffect, useState } from 'react';

import { buscarDebito } from '../lib/debitos-api';
import type { ProcessoDebitoDetalhe } from '../types/debito.types';

export function useDebitoDetalhe(processoId: string) {
  const [processo, setProcesso] = useState<ProcessoDebitoDetalhe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!processoId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const detalhe = await buscarDebito(processoId);
      setProcesso(detalhe);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar processo',
      );
      setProcesso(null);
    } finally {
      setIsLoading(false);
    }
  }, [processoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return {
    processo,
    isLoading,
    error,
    recarregar: carregar,
  };
}
