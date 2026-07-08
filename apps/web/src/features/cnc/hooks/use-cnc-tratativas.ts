'use client';

import { useCallback, useState } from 'react';

import { toast } from 'sonner';

import {
  adicionarTratativa,
  concluirTratativa,
  type AdicionarTratativaBody,
} from '@/features/cnc/lib/cnc-api';

export function useCncTratativas(
  cncId: string,
  onRefetch: () => Promise<void>,
) {
  const [processando, setProcessando] = useState(false);

  const adicionar = useCallback(
    async (body: AdicionarTratativaBody) => {
      setProcessando(true);

      try {
        await adicionarTratativa(cncId, body);
        toast.success('Tratativa adicionada com sucesso.');
        await onRefetch();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível adicionar a tratativa.';

        toast.error(message);
        throw error;
      } finally {
        setProcessando(false);
      }
    },
    [cncId, onRefetch],
  );

  const concluir = useCallback(
    async (tratativaId: string) => {
      setProcessando(true);

      try {
        await concluirTratativa(cncId, tratativaId);
        toast.success('Tratativa concluída.');
        await onRefetch();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível concluir a tratativa.';

        toast.error(message);
      } finally {
        setProcessando(false);
      }
    },
    [cncId, onRefetch],
  );

  return {
    processando,
    adicionar,
    concluir,
  };
}
