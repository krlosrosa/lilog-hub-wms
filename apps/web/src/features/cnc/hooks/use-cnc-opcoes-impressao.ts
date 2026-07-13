'use client';

import { useCallback, useState } from 'react';

import { toast } from 'sonner';

import { atualizarOpcoesImpressaoCnc } from '@/features/cnc/lib/cnc-api';
import type { CncImpressaoOpcoes } from '@/features/cnc/types/cnc-impressao.schema';

type OpcoesSalvas = {
  opcoesImpressao: CncImpressaoOpcoes | null;
  updatedAt: string;
};

export function useCncOpcoesImpressao(
  cncId: string,
  onSalvo?: (dados: OpcoesSalvas) => void,
) {
  const [salvando, setSalvando] = useState(false);

  const salvar = useCallback(
    async (opcoes: CncImpressaoOpcoes) => {
      setSalvando(true);

      try {
        const response = await atualizarOpcoesImpressaoCnc(cncId, opcoes);
        onSalvo?.({
          opcoesImpressao: response.opcoesImpressao ?? opcoes,
          updatedAt: response.updatedAt,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar as opções de impressão.';

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
