'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';

import {
  listDisponibilidadeEstoqueAgrupado,
  mapDisponibilidadeAgrupadoToLoteItem,
} from '@/features/estoque/lib/estoque-api';
import type { EstoqueLoteAgrupadoItem } from '@/features/estoque/types/estoque-gestao.schema';
import { ApiClientError } from '@/lib/api';

type UseSaldoLotesParams = {
  unidadeId?: string;
  produtoId: string;
  depositoId?: string;
  statusFiltro?: 'liberado' | 'bloqueado' | 'todos';
  naturezaFiltro?: 'fisico' | 'debito' | 'todos';
  loteFiltro?: string;
  gruposFiltro?: string[];
  enabled: boolean;
};

const cache = new Map<string, EstoqueLoteAgrupadoItem[]>();

function buildCacheKey(params: UseSaldoLotesParams): string {
  return [
    params.unidadeId ?? '',
    params.produtoId,
    params.depositoId ?? '',
    params.statusFiltro ?? 'todos',
    params.naturezaFiltro ?? 'todos',
    params.loteFiltro ?? '',
    (params.gruposFiltro ?? []).join(','),
  ].join('|');
}

export function useSaldoLotes({
  unidadeId,
  produtoId,
  depositoId,
  statusFiltro = 'todos',
  naturezaFiltro = 'todos',
  loteFiltro = '',
  gruposFiltro = [],
  enabled,
}: UseSaldoLotesParams) {
  const [isLoading, setIsLoading] = useState(false);
  const [lotes, setLotes] = useState<EstoqueLoteAgrupadoItem[]>([]);
  const loadedKeyRef = useRef<string | null>(null);

  const carregar = useCallback(async () => {
    if (!unidadeId || !enabled) {
      return;
    }

    const cacheKey = buildCacheKey({
      unidadeId,
      produtoId,
      depositoId,
      statusFiltro,
      naturezaFiltro,
      loteFiltro,
      gruposFiltro,
      enabled,
    });

    const cached = cache.get(cacheKey);
    if (cached) {
      setLotes(cached);
      loadedKeyRef.current = cacheKey;
      return;
    }

    setIsLoading(true);

    try {
      const response = await listDisponibilidadeEstoqueAgrupado({
        unidadeId,
        produtoId,
        depositoId: depositoId || undefined,
        status: statusFiltro === 'todos' ? undefined : statusFiltro,
        natureza: naturezaFiltro === 'todos' ? undefined : naturezaFiltro,
        lote: loteFiltro || undefined,
        grupos: gruposFiltro.length > 0 ? gruposFiltro : undefined,
        groupBy: 'lote',
        page: 1,
        limit: 100,
      });

      const mapped = response.items.map(mapDisponibilidadeAgrupadoToLoteItem);
      cache.set(cacheKey, mapped);
      loadedKeyRef.current = cacheKey;
      setLotes(mapped);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar os lotes do produto.';
      toast.error(message);
      setLotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    depositoId,
    enabled,
    gruposFiltro,
    loteFiltro,
    naturezaFiltro,
    produtoId,
    statusFiltro,
    unidadeId,
  ]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const cacheKey = buildCacheKey({
      unidadeId,
      produtoId,
      depositoId,
      statusFiltro,
      naturezaFiltro,
      loteFiltro,
      gruposFiltro,
      enabled,
    });

    if (loadedKeyRef.current === cacheKey) {
      return;
    }

    void carregar();
  }, [carregar, depositoId, enabled, gruposFiltro, loteFiltro, naturezaFiltro, produtoId, statusFiltro, unidadeId]);

  return {
    isLoading,
    lotes,
    recarregar: carregar,
  };
}
