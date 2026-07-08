'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';

import {
  listSaldosEndereco,
  mapSaldoEnderecoToListaItem,
} from '@/features/estoque/lib/estoque-api';
import type { EstoqueListaItem } from '@/features/estoque/types/estoque-gestao.schema';
import { ApiClientError } from '@/lib/api';

type UseSaldoPosicoesParams = {
  unidadeId?: string;
  produtoId: string;
  lote: string;
  depositoId?: string;
  enabled: boolean;
};

const cache = new Map<string, EstoqueListaItem[]>();

function buildCacheKey(params: UseSaldoPosicoesParams): string {
  return [
    params.unidadeId ?? '',
    params.produtoId,
    params.lote,
    params.depositoId ?? '',
  ].join('|');
}

export function useSaldoPosicoes({
  unidadeId,
  produtoId,
  lote,
  depositoId,
  enabled,
}: UseSaldoPosicoesParams) {
  const [isLoading, setIsLoading] = useState(false);
  const [itens, setItens] = useState<EstoqueListaItem[]>([]);
  const loadedKeyRef = useRef<string | null>(null);

  const carregar = useCallback(async () => {
    if (!unidadeId || !enabled) {
      return;
    }

    const cacheKey = buildCacheKey({ unidadeId, produtoId, lote, depositoId, enabled });
    const cached = cache.get(cacheKey);
    if (cached) {
      setItens(cached);
      loadedKeyRef.current = cacheKey;
      return;
    }

    setIsLoading(true);

    try {
      const response = await listSaldosEndereco({
        unidadeId,
        produtoId,
        lote: lote || undefined,
        depositoId: depositoId || undefined,
      });

      const mapped = response.items
        .filter((item) => item.quantidade > 0)
        .map(mapSaldoEnderecoToListaItem);
      cache.set(cacheKey, mapped);
      loadedKeyRef.current = cacheKey;
      setItens(mapped);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar as posições do lote.';
      toast.error(message);
      setItens([]);
    } finally {
      setIsLoading(false);
    }
  }, [depositoId, enabled, lote, produtoId, unidadeId]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const cacheKey = buildCacheKey({ unidadeId, produtoId, lote, depositoId, enabled });
    if (loadedKeyRef.current === cacheKey) {
      return;
    }

    void carregar();
  }, [carregar, depositoId, enabled, lote, produtoId, unidadeId]);

  return {
    isLoading,
    itens,
    recarregar: carregar,
  };
}
