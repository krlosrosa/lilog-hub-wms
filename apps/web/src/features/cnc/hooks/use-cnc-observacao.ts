'use client';

import { useCallback, useState } from 'react';

import { toast } from 'sonner';

import { atualizarObservacaoCnc } from '@/features/cnc/lib/cnc-api';

type ObservacaoSalva = {
  observacao: string | null;
  updatedAt: string;
};

export function useCncObservacao(
  cncId: string,
  onSalvo?: (dados: ObservacaoSalva) => void,
) {
  const [salvando, setSalvando] = useState(false);

  const salvar = useCallback(
    async (observacao: string | null) => {
      setSalvando(true);

      try {
        const response = await atualizarObservacaoCnc(cncId, {
          observacao,
        });

        onSalvo?.({
          observacao: response.observacao,
          updatedAt: response.updatedAt,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar a observação.';

        toast.error(message);
        throw error;
      } finally {
        setSalvando(false);
      }
    },
    [cncId, onSalvo],
  );

  return {
    salvar,
    salvando,
  };
}
