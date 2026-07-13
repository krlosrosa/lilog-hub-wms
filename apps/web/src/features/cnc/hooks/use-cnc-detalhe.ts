'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  buscarCnc,
  cancelarCnc,
  encerrarCnc,
  iniciarAnaliseCnc,
  mapCncApiToDetalhe,
  type CancelarCncBody,
  type EncerrarCncBody,
} from '@/features/cnc/lib/cnc-api';
import type { CncDetalhe } from '@/features/cnc/types/cnc.schema';
import { ApiClientError } from '@/lib/api';

export function useCncDetalhe(cncId: string) {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [cnc, setCnc] = useState<CncDetalhe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(false);

  const carregarDetalhe = useCallback(async () => {
    if (!unidadeId) {
      setCnc(null);
      setNotFound(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setNotFound(false);

    try {
      const response = await buscarCnc(cncId);
      setCnc(mapCncApiToDetalhe(response));
    } catch (error) {
      setCnc(null);

      if (error instanceof ApiClientError && error.status === 404) {
        setNotFound(true);
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar a não conformidade.';

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [cncId, unidadeId]);

  useEffect(() => {
    void carregarDetalhe();
  }, [carregarDetalhe]);

  const iniciarAnalise = useCallback(async () => {
    setProcessandoAcao(true);

    try {
      await iniciarAnaliseCnc(cncId);
      toast.success('Análise iniciada com sucesso.');
      await carregarDetalhe();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível iniciar a análise.';

      toast.error(message);
    } finally {
      setProcessandoAcao(false);
    }
  }, [cncId, carregarDetalhe]);

  const encerrar = useCallback(
    async (body: EncerrarCncBody) => {
      setProcessandoAcao(true);

      try {
        await encerrarCnc(cncId, body);
        toast.success('Não conformidade encerrada com sucesso.');
        await carregarDetalhe();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível encerrar a não conformidade.';

        toast.error(message);
      } finally {
        setProcessandoAcao(false);
      }
    },
    [cncId, carregarDetalhe],
  );

  const cancelar = useCallback(
    async (body: CancelarCncBody) => {
      setProcessandoAcao(true);

      try {
        await cancelarCnc(cncId, body);
        toast.success('Não conformidade cancelada.');
        await carregarDetalhe();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível cancelar a não conformidade.';

        toast.error(message);
      } finally {
        setProcessandoAcao(false);
      }
    },
    [cncId, carregarDetalhe],
  );

  const atualizarCnc = useCallback((patch: Partial<CncDetalhe>) => {
    setCnc((atual) => (atual ? { ...atual, ...patch } : atual));
  }, []);

  return {
    cnc,
    isLoading,
    notFound,
    processandoAcao,
    recarregar: carregarDetalhe,
    atualizarCnc,
    actions: {
      iniciarAnalise,
      encerrar,
      cancelar,
    },
  };
}
