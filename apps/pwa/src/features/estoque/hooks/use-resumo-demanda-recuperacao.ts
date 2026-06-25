import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { buildResumo } from '../lib/recuperacao-store';
import {
  useRecuperacaoDemanda,
  useRecuperacaoVersion,
} from './use-recuperacao-store';

export type ResumoRecuperacaoToast = {
  message: string;
  variant: 'success' | 'error';
};

export function useResumoDemandaRecuperacao(demandaId: string) {
  const navigate = useNavigate();
  const demanda = useRecuperacaoDemanda(demandaId);
  const version = useRecuperacaoVersion();
  const resumo = useMemo(
    () => buildResumo(demandaId),
    [demandaId, version],
  );
  const [toast, setToast] = useState<ResumoRecuperacaoToast | null>(null);

  const showToast = useCallback((next: ResumoRecuperacaoToast) => {
    setToast(next);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const voltarParaLista = useCallback(() => {
    hapticMedium();
    void navigate({ to: '/estoque/recuperacao' });
  }, [navigate]);

  const imprimirEtiqueta = useCallback(() => {
    hapticMedium();
    showToast({
      message: 'Etiqueta enviada para impressão',
      variant: 'success',
    });
  }, [showToast]);

  return {
    state: {
      demanda,
      resumo,
      toast,
    },
    actions: {
      voltarParaLista,
      imprimirEtiqueta,
    },
  };
}
