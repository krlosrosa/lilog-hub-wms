'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  cancelarCorteOperacional,
  getCorteOperacional,
  iniciarCorteOperacional,
  realizarCorteOperacional,
} from '@/features/corte-operacional/lib/corte-operacional-api';
import type { CorteDetalhe } from '@/features/corte-operacional/types/corte-operacional.schema';
import { ApiClientError } from '@/lib/api';

export function useCorteOperacionalDetalhe(corteId: string) {
  const { unidadeSelecionada, isResolved } = useUnidadeContext();
  const [corte, setCorte] = useState<CorteDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!unidadeSelecionada) {
      setCorte(null);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const detalhe = await getCorteOperacional(unidadeSelecionada.id, corteId);
      setCorte(detalhe);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Erro ao carregar corte operacional';
      setErro(message);
      setCorte(null);
    } finally {
      setCarregando(false);
    }
  }, [corteId, unidadeSelecionada]);

  useEffect(() => {
    if (!isResolved) return;
    void carregar();
  }, [isResolved, carregar]);

  const iniciar = useCallback(async () => {
    if (!unidadeSelecionada) return false;

    setProcessando(true);
    try {
      const atualizado = await iniciarCorteOperacional(
        unidadeSelecionada.id,
        corteId,
      );
      setCorte(atualizado);
      toast.success('Realização do corte iniciada');
      return true;
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : 'Erro ao iniciar corte',
      );
      return false;
    } finally {
      setProcessando(false);
    }
  }, [corteId, unidadeSelecionada]);

  const realizar = useCallback(async () => {
    if (!unidadeSelecionada) return false;

    setProcessando(true);
    try {
      const atualizado = await realizarCorteOperacional(
        unidadeSelecionada.id,
        corteId,
      );
      setCorte(atualizado);
      toast.success('Corte concluído com sucesso');
      return true;
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : 'Erro ao concluir corte',
      );
      return false;
    } finally {
      setProcessando(false);
    }
  }, [corteId, unidadeSelecionada]);

  const cancelar = useCallback(
    async (motivoCancelamento: string) => {
      if (!unidadeSelecionada) return false;

      setProcessando(true);
      try {
        const atualizado = await cancelarCorteOperacional(
          unidadeSelecionada.id,
          corteId,
          motivoCancelamento,
        );
        setCorte(atualizado);
        toast.success('Corte cancelado');
        return true;
      } catch (error) {
        toast.error(
          error instanceof ApiClientError
            ? error.message
            : 'Erro ao cancelar corte',
        );
        return false;
      } finally {
        setProcessando(false);
      }
    },
    [corteId, unidadeSelecionada],
  );

  return {
    corte,
    carregando,
    processando,
    erro,
    recarregar: carregar,
    iniciar,
    realizar,
    cancelar,
  };
}
