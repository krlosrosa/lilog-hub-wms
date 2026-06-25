import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { hapticMedium } from '@/lib/haptics';

import {
  isArmazenagemParcial,
  type QuantidadeArmazenagem,
} from '../lib/armazenagem-quantidade';
import {
  armazenagemFormSchema,
  type ArmazenagemForm,
} from '../types/armazenagem.schema';

export type ArmazenagemToast = {
  message: string;
  variant: 'success' | 'error';
};

const TOAST_DURATION_MS = 2500;

const DEFAULT_VALUES: ArmazenagemForm = {
  codigoProduto: '',
  enderecoPicking: '',
  quantidadeCaixas: 0,
  quantidadeUnidades: 0,
};

export interface UseArmazenagemOptions {
  getSolicitado?: () => QuantidadeArmazenagem;
  onComplete?: (data: ArmazenagemForm) => void | Promise<void>;
}

export function useArmazenagem(options: UseArmazenagemOptions = {}) {
  const { getSolicitado, onComplete } = options;
  const [toast, setToast] = useState<ArmazenagemToast | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<ArmazenagemForm>({
    resolver: zodResolver(armazenagemFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  });

  const { reset } = form;

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, variant: ArmazenagemToast['variant']) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setToast({ message, variant });
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, TOAST_DURATION_MS);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const onConfirmar = useCallback(
    form.handleSubmit(async (data) => {
      const caixas = Number(data.quantidadeCaixas) || 0;
      const unidades = Number(data.quantidadeUnidades) || 0;

      if (caixas <= 0 && unidades <= 0) {
        showToast('Informe a quantidade em caixas ou unidades.', 'error');
        return;
      }

      hapticMedium();

      const solicitado = getSolicitado?.() ?? { caixas: 0, unidades: 0 };
      const guardado = { caixas, unidades };
      const parcial = isArmazenagemParcial(solicitado, guardado);

      try {
        await onComplete?.(data);
        showToast(
          parcial
            ? `Armazenagem parcial: ${data.codigoProduto}`
            : `Produto guardado em ${data.enderecoPicking}`,
          parcial ? 'error' : 'success',
        );
        reset(DEFAULT_VALUES);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Falha ao confirmar armazenagem. Tente novamente.';
        showToast(message, 'error');
        throw error;
      }
    }),
    [form, reset, showToast, onComplete, getSolicitado]
  );

  return {
    state: {
      form,
      isSubmitting: form.formState.isSubmitting,
      toast,
    },
    actions: {
      onConfirmar,
      dismissToast,
    },
  };
}
