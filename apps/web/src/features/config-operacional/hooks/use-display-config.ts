'use client';

import { useCallback, useEffect, useState } from 'react';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  DEFAULT_DISPLAY_CONFIG,
  type DisplayConfig,
  formatQuantidadeFromBaseUN,
  formatQuantidadeFromBaseUNSigned,
  formatQuantidadeValue,
} from '@/lib/format-quantidade';
import {
  DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA,
  RECEBIMENTO_CONFERENCIA_CATEGORIA,
  RECEBIMENTO_DOMINIO,
  RECEBIMENTO_PARAMETROS_SUBTIPO,
  type ParametrosRecebimentoConferenciaApi,
} from '@/features/config-operacional/types/configuracao-operacional.api';
import { listarConfiguracoesOperacionais } from '@/features/config-operacional/lib/configuracao-operacional-api';

function toDisplayConfig(
  parametros: ParametrosRecebimentoConferenciaApi,
): DisplayConfig {
  return {
    unidadePadrao: parametros.displayUnidadePadrao,
    decimaisCaixa: parametros.displayDecimaisCaixa,
    decimaisUnidade: parametros.displayDecimaisUnidade,
  };
}

export function useDisplayConfig() {
  const { unidadeSelecionada, isResolved } = useUnidadeContext();
  const [config, setConfig] = useState<DisplayConfig>(DEFAULT_DISPLAY_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isResolved || !unidadeSelecionada?.id) {
      setConfig(DEFAULT_DISPLAY_CONFIG);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function carregarConfig() {
      setIsLoading(true);

      try {
        const response = await listarConfiguracoesOperacionais({
          unidadeId: unidadeSelecionada!.id,
          dominio: RECEBIMENTO_DOMINIO,
          categoria: RECEBIMENTO_CONFERENCIA_CATEGORIA,
          subtipo: RECEBIMENTO_PARAMETROS_SUBTIPO,
          ativo: true,
        });

        if (cancelled) {
          return;
        }

        const padrao =
          response.items.find((item) => item.isPadrao) ?? response.items[0];
        const parametros =
          (padrao?.parametros as ParametrosRecebimentoConferenciaApi | undefined) ??
          DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA;

        setConfig(toDisplayConfig(parametros));
      } catch {
        if (!cancelled) {
          setConfig(DEFAULT_DISPLAY_CONFIG);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void carregarConfig();

    return () => {
      cancelled = true;
    };
  }, [isResolved, unidadeSelecionada?.id]);

  const formatQtd = useCallback(
    (
      qtdBaseUN: number | null,
      unidadesPorCaixa?: number | null,
    ) => formatQuantidadeFromBaseUN(qtdBaseUN, unidadesPorCaixa, config),
    [config],
  );

  const formatQtdSigned = useCallback(
    (
      qtdBaseUN: number | null,
      unidadesPorCaixa?: number | null,
    ) => formatQuantidadeFromBaseUNSigned(qtdBaseUN, unidadesPorCaixa, config),
    [config],
  );

  const formatQtdValue = useCallback(
    (value: number | null, unidade?: string | null) =>
      formatQuantidadeValue(value, unidade, config),
    [config],
  );

  return {
    config,
    isLoading,
    formatQtd,
    formatQtdSigned,
    formatQtdValue,
  };
}
