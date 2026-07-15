'use client';

import { useCallback, useEffect, useState } from 'react';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';
import { useVisibleInterval } from '@/lib/use-visible-interval';
import { criarSnapshotVazio } from '@/features/recebimento-painel/lib/criar-snapshot-vazio';
import {
  criarIntervaloPadraoHoje,
  intervaloParaIsoDatetime,
  normalizarIntervaloData,
  type IntervaloDataPainel,
} from '@/features/recebimento-painel/lib/intervalo-data';
import { getRecebimentoPainelSnapshot } from '@/features/recebimento-painel/lib/recebimento-painel-api';
import type { RecebimentoPainelSnapshot } from '@/features/recebimento-painel/types/recebimento-painel.schema';

const REFRESH_INTERVAL_MS = 60_000;

export type UseRecebimentoPainelParams = {
  intervalo: IntervaloDataPainel;
};

export function useRecebimentoPainel({ intervalo }: UseRecebimentoPainelParams) {
  const { unidadeSelecionada, isResolved: unidadeResolvida } =
    useUnidadeContext();

  const [snapshot, setSnapshot] = useState<RecebimentoPainelSnapshot>(
    criarSnapshotVazio(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarSnapshot = useCallback(
    async (modo: 'initial' | 'refresh' = 'initial') => {
      if (!unidadeResolvida) {
        return;
      }

      if (!unidadeSelecionada?.id) {
        setSnapshot(criarSnapshotVazio());
        setErro('Selecione uma unidade para visualizar o painel.');
        setIsError(true);
        setIsLoading(false);
        return;
      }

      if (modo === 'initial') {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const intervaloNormalizado = normalizarIntervaloData(intervalo);
        const { dataInicio, dataFim } =
          intervaloParaIsoDatetime(intervaloNormalizado);

        const resultado = await getRecebimentoPainelSnapshot({
          unidadeId: unidadeSelecionada.id,
          dataInicio,
          dataFim,
          dataReferencia: intervaloNormalizado.dataFim,
        });

        setSnapshot(resultado);
        setErro(null);
        setIsError(false);
      } catch (error) {
        setIsError(true);
        setErro(
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível carregar o painel de recebimento.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [intervalo, unidadeResolvida, unidadeSelecionada?.id],
  );

  useEffect(() => {
    void carregarSnapshot('initial');
  }, [carregarSnapshot]);

  useVisibleInterval(
    () => {
      void carregarSnapshot('refresh');
    },
    REFRESH_INTERVAL_MS,
    Boolean(unidadeSelecionada?.id),
  );

  return {
    snapshot,
    isLoading,
    isRefreshing,
    isError,
    erro,
    refetch: () => carregarSnapshot('refresh'),
  };
}

export { criarIntervaloPadraoHoje };
export type { IntervaloDataPainel };
