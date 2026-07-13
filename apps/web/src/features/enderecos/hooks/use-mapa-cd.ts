'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { getMapaCd } from '@/features/enderecos/lib/endereco-api';
import type {
  GetMapaCdResponse,
  MapaCdZona,
  PosicaoSelecionada,
} from '@/features/enderecos/types/mapa-cd.schema';
import { ApiClientError } from '@/lib/api';

export function useMapaCd() {
  const searchParams = useSearchParams();
  const zonaInicial = searchParams.get('zona');
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [data, setData] = useState<GetMapaCdResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zonaAtiva, setZonaAtiva] = useState<string | null>(null);
  const [posicaoSelecionada, setPosicaoSelecionada] =
    useState<PosicaoSelecionada | null>(null);

  const carregar = useCallback(async () => {
    if (!unidadeId) {
      setData(null);
      setIsLoading(false);
      setError('Selecione uma unidade para visualizar o mapa do CD.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getMapaCd(unidadeId);
      setData(response);
      setZonaAtiva((atual) => {
        if (atual && response.zonas.some((zona) => zona.zona === atual)) {
          return atual;
        }

        if (
          zonaInicial &&
          response.zonas.some((zona) => zona.zona === zonaInicial)
        ) {
          return zonaInicial;
        }

        return response.zonas[0]?.zona ?? null;
      });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Não foi possível carregar o mapa do CD';

      setError(message);
      setData(null);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId, zonaInicial]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const zonaAtual = useMemo<MapaCdZona | null>(() => {
    if (!data || !zonaAtiva) {
      return null;
    }

    return data.zonas.find((zona) => zona.zona === zonaAtiva) ?? null;
  }, [data, zonaAtiva]);

  const selecionarPosicao = useCallback(
    (zona: string, rua: string, posicao: string, niveis: PosicaoSelecionada['niveis']) => {
      setPosicaoSelecionada({ zona, rua, posicao, niveis });
    },
    [],
  );

  const fecharDrawer = useCallback(() => {
    setPosicaoSelecionada(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    zonaAtiva,
    zonaAtual,
    posicaoSelecionada,
    unidadeId,
    unidadeLabel: unidadeSelecionada?.nome ?? '—',
    setZonaAtiva,
    selecionarPosicao,
    fecharDrawer,
    recarregar: carregar,
  };
}
