import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useRef, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { getResumoByTarefaId } from '../data/peso-variavel-seed';

export type ResumoPickingToast = {
  message: string;
  variant: 'success' | 'error';
};

const TOAST_DURATION_MS = 2500;

export function useResumoPicking(tarefaId: string) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [toast, setToast] = useState<ResumoPickingToast | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resumo = useMemo(() => getResumoByTarefaId(tarefaId), [tarefaId]);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, variant: ResumoPickingToast['variant']) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setToast({ message, variant });
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, TOAST_DURATION_MS);
    },
    [],
  );

  const handleImprimir = useCallback(() => {
    hapticMedium();
    showToast('Enviando etiquetas para impressão...', 'success');
  }, [showToast]);

  const handleFinalizar = useCallback(async () => {
    if (isFinished) return;

    setIsSubmitting(true);
    hapticMedium();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmitting(false);
    setIsFinished(true);
    showToast(`Tarefa ${resumo.loteId} finalizada com sucesso.`, 'success');

    window.setTimeout(() => {
      void navigate({ to: '/' });
    }, 1500);
  }, [isFinished, resumo.loteId, navigate, showToast]);

  return {
    state: {
      resumo,
      isSubmitting,
      isFinished,
      toast,
    },
    actions: {
      handleImprimir,
      handleFinalizar,
      dismissToast,
    },
  };
}
