import { useCallback, useEffect, useState } from 'react';

import {
  fetchInventoryDemandEnderecos,
  isApiConfigured,
} from '@/lib/offline/api-client';

import { SEED_CONTAGEM_ENDERECOS } from '../data/contagem-seed';
import type { InventoryAddress } from '../types/estoque.schema';

export function useContagemEnderecos(demandaId: string) {
  const [enderecos, setEnderecos] = useState<InventoryAddress[]>(() =>
    isApiConfigured() ? [] : (SEED_CONTAGEM_ENDERECOS[demandaId] ?? []),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await fetchInventoryDemandEnderecos<InventoryAddress>(
        demandaId,
      );
      setEnderecos(items);
    } catch (err) {
      if (!isApiConfigured()) {
        const seed = SEED_CONTAGEM_ENDERECOS[demandaId];
        if (seed) {
          setEnderecos(seed);
        }
      } else {
        setEnderecos([]);
        setError(
          err instanceof Error ? err.message : 'Falha ao carregar endereços',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [demandaId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    enderecos,
    isLoading,
    error,
    refresh,
  };
}
