import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { hapticMedium } from '@/lib/haptics';
import { submitContagemCega } from '@/lib/offline/api-client';

import { SKU_INVALIDO_MSG, validarSkuContagem } from '../lib/validar-sku-contagem';
import {
  contagemCegaFormSchema,
  type ContagemCegaForm,
} from '../types/estoque.schema';

export type ContagemCegaToast = {
  message: string;
  variant: 'success' | 'error';
};

const TOAST_DURATION_MS = 2500;

const DEFAULT_VALUES: ContagemCegaForm = {
  enderecoArmazenagem: '',
  codigoProduto: '',
  quantidadeCaixas: 0,
  quantidadeUnidades: 0,
  lote: '',
  peso: 0,
};

export interface UseContagemCegaOptions {
  onComplete?: () => void;
  demandaId?: string;
  demandaEnderecoId?: string;
}

export function useContagemCega(options: UseContagemCegaOptions = {}) {
  const { onComplete, demandaId, demandaEnderecoId } = options;
  const [toast, setToast] = useState<ContagemCegaToast | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<ContagemCegaForm>({
    resolver: zodResolver(contagemCegaFormSchema),
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
    (message: string, variant: ContagemCegaToast['variant']) => {
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

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const onConfirmar = useCallback(
    form.handleSubmit(async (data) => {
      const totalUnidades =
        (Number(data.quantidadeCaixas) || 0) + (Number(data.quantidadeUnidades) || 0);

      if (totalUnidades <= 0) {
        showToast('Informe a quantidade em caixas ou unidades.', 'error');
        return;
      }

      if (!data.lote?.trim()) {
        showToast('Informe o lote.', 'error');
        return;
      }

      if (!data.peso || data.peso <= 0) {
        showToast('Informe o peso.', 'error');
        return;
      }

      const produtoValidado = await validarSkuContagem(data.codigoProduto);
      if (!produtoValidado) {
        showToast(SKU_INVALIDO_MSG, 'error');
        return;
      }

      hapticMedium();

      try {
        if (demandaId && demandaEnderecoId) {
          await submitContagemCega(demandaId, demandaEnderecoId, {
            enderecoArmazenagem: data.enderecoArmazenagem,
            codigoProduto: produtoValidado.sku,
            quantidadeCaixas: Number(data.quantidadeCaixas) || 0,
            quantidadeUnidades: Number(data.quantidadeUnidades) || 0,
            lote: data.lote,
            peso: Number(data.peso),
          });
        } else {
          await new Promise((r) => setTimeout(r, 400));
        }

        showToast(`Contagem finalizada para ${produtoValidado.sku}`, 'success');
        reset(DEFAULT_VALUES);
        onComplete?.();
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Erro ao salvar contagem',
          'error',
        );
      }
    }),
    [demandaEnderecoId, demandaId, form, onComplete, reset, showToast],
  );

  const onConfirmarEnderecoVazio = useCallback(
    async (endereco: string) => {
      if (!endereco.trim()) {
        showToast('Informe o endereço.', 'error');
        return;
      }

      hapticMedium();

      try {
        if (demandaId && demandaEnderecoId) {
          await submitContagemCega(demandaId, demandaEnderecoId, {
            enderecoArmazenagem: endereco,
            enderecoVazio: true,
            quantidadeCaixas: 0,
            quantidadeUnidades: 0,
          });
        } else {
          await new Promise((r) => setTimeout(r, 400));
        }

        showToast(`Endereço vazio registrado: ${endereco.trim()}`, 'success');
        reset(DEFAULT_VALUES);
        onComplete?.();
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Erro ao registrar endereço vazio',
          'error',
        );
      }
    },
    [demandaEnderecoId, demandaId, onComplete, reset, showToast],
  );

  return {
    state: {
      form,
      isSubmitting: form.formState.isSubmitting,
      toast,
    },
    actions: {
      onConfirmar,
      onConfirmarEnderecoVazio,
      dismissToast,
    },
  };
}
