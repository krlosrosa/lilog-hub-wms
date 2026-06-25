import { useNavigate } from '@tanstack/react-router';
import { useCallback, useRef, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { MOCK_PASSAGEM_BASTAO } from '../data/passagem-bastao-seed';

export type ResumoTurnoToast = {
  message: string;
  variant: 'success' | 'error';
};

const TOAST_DURATION_MS = 2500;

export function useResumoTurno() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ResumoTurnoToast | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const passagem = MOCK_PASSAGEM_BASTAO;

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, variant: ResumoTurnoToast['variant']) => {
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

  const handleSignatureChange = useCallback((signed: boolean) => {
    setHasSignature(signed);
  }, []);

  const handleFinalize = useCallback(async () => {
    if (!hasSignature) {
      hapticMedium();
      showToast('Assinatura digital obrigatória.', 'error');
      return;
    }

    if (pin.trim().length < 4) {
      hapticMedium();
      showToast('Informe seu PIN ou senha para confirmar.', 'error');
      return;
    }

    setIsSubmitting(true);
    hapticMedium();
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);
    showToast('Passagem de turno finalizada com sucesso!', 'success');

    window.setTimeout(() => {
      navigate({ to: '/' });
    }, 1200);
  }, [hasSignature, pin, navigate, showToast]);

  const progressOffset = 251.2 - (passagem.progressoChecklist / 100) * 251.2;

  return {
    state: {
      passagem,
      pin,
      hasSignature,
      isSubmitting,
      toast,
      progressOffset,
      divergenciaCount: passagem.divergencias.length,
    },
    actions: {
      setPin,
      handleSignatureChange,
      handleFinalize,
      dismissToast,
    },
  };
}
