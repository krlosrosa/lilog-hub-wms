import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { hapticMedium } from '@/lib/haptics';

import {
  isSeparacaoParcial,
  type QuantidadeSeparacao,
} from '../lib/separacao-quantidade';
import {
  separacaoFormSchema,
  type SeparacaoForm,
} from '../types/separacao.schema';

export type SeparacaoToast = {
  message: string;
  variant: 'success' | 'error';
};

const TOAST_DURATION_MS = 2500;

const DEFAULT_VALUES: SeparacaoForm = {
  enderecoColeta: '',
  codigoProduto: '',
  quantidadeCaixas: 0,
  quantidadeUnidades: 0,
};

export interface UseSeparacaoOptions {
  getSolicitado?: () => QuantidadeSeparacao;
  onComplete?: (data: SeparacaoForm) => void;
  onCompleteEsgotado?: () => void;
}

export function useSeparacao(options: UseSeparacaoOptions = {}) {
  const { getSolicitado, onComplete, onCompleteEsgotado } = options;
  const [toast, setToast] = useState<SeparacaoToast | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<SeparacaoForm>({
    resolver: zodResolver(separacaoFormSchema),
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
    (message: string, variant: SeparacaoToast['variant']) => {
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
      await new Promise((r) => setTimeout(r, 400));

      const solicitado = getSolicitado?.() ?? { caixas: 0, unidades: 0 };
      const separado = { caixas, unidades };
      const parcial = isSeparacaoParcial(solicitado, separado);

      showToast(
        parcial
          ? `Separação parcial: ${data.codigoProduto}`
          : `Separação confirmada para ${data.codigoProduto}`,
        parcial ? 'error' : 'success'
      );
      reset(DEFAULT_VALUES);
      onComplete?.(data);
    }),
    [form, reset, showToast, onComplete, getSolicitado]
  );

  const onConfirmarItemEsgotado = useCallback(
    async (endereco: string, codigo: string) => {
      if (!endereco.trim()) {
        showToast('Informe o endereço.', 'error');
        return;
      }

      hapticMedium();
      await new Promise((r) => setTimeout(r, 400));
      showToast(
        codigo.trim()
          ? `Item esgotado registrado: ${codigo.trim()}`
          : `Endereço esgotado registrado: ${endereco.trim()}`
        ,
        'success'
      );
      reset(DEFAULT_VALUES);
      onCompleteEsgotado?.();
    },
    [reset, showToast, onCompleteEsgotado]
  );

  return {
    state: {
      form,
      isSubmitting: form.formState.isSubmitting,
      toast,
    },
    actions: {
      onConfirmar,
      onConfirmarItemEsgotado,
      dismissToast,
    },
  };
}
