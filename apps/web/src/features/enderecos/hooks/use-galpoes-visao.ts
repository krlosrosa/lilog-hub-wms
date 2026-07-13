'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { getMapaCd } from '@/features/enderecos/lib/endereco-api';
import {
  calcularKpiZona,
  type GalpaoKpi,
  type GetMapaCdResponse,
  type MapaCdZona,
} from '@/features/enderecos/types/mapa-cd.schema';
import { ApiClientError } from '@/lib/api';

export type GalpaoVisaoItem = {
  zona: MapaCdZona;
  kpi: GalpaoKpi;
};

export function useGalpoesVisao() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [data, setData] = useState<GetMapaCdResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galpaoSelecionado, setGalpaoSelecionado] = useState<string | null>(
    null,
  );

  const carregar = useCallback(async () => {
    if (!unidadeId) {
      setData(null);
      setIsLoading(false);
      setError('Selecione uma unidade para visualizar os galpões.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getMapaCd(unidadeId);
      setData(response);
      setGalpaoSelecionado((atual) => {
        if (atual && response.zonas.some((zona) => zona.zona === atual)) {
          return atual;
        }

        return response.zonas[0]?.zona ?? null;
      });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Não foi possível carregar os galpões';

      setError(message);
      setData(null);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const galpoes = useMemo<GalpaoVisaoItem[]>(() => {
    if (!data) {
      return [];
    }

    return data.zonas.map((zona) => ({
      zona,
      kpi: calcularKpiZona(zona),
    }));
  }, [data]);

  const galpaoAtual = useMemo<GalpaoVisaoItem | null>(() => {
    if (!galpaoSelecionado) {
      return galpoes[0] ?? null;
    }

    return galpoes.find((item) => item.zona.zona === galpaoSelecionado) ?? null;
  }, [galpaoSelecionado, galpoes]);

  return {
    data,
    galpoes,
    galpaoAtual,
    galpaoSelecionado,
    isLoading,
    error,
    unidadeId,
    unidadeLabel: unidadeSelecionada?.nome ?? '—',
    setGalpaoSelecionado,
    recarregar: carregar,
  };
}
