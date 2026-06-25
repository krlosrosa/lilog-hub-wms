import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { hapticMedium } from '@/lib/haptics';
import { submitContagemValidacao } from '@/lib/offline/api-client';

import {
  contagemValidacaoFormSchema,
  type ContagemValidacaoForm,
} from '../types/estoque.schema';

export type ContagemValidacaoToast = {
  message: string;
  variant: 'success' | 'error';
};

export const PRODUTO_VALIDACAO_MOCK = {
  localizacao: 'A-12-04-B',
  nome: 'Válvula Hidráulica Industrial G2',
  sku: '#88291-ZX',
  lote: 'L2023-B42',
  pesoTotal: '4.2 kg',
  quantidadeEsperada: 50,
  ssccEsperado: '0034059200001234',
  instrucao:
    'Verifique a integridade da embalagem antes de confirmar a contagem.',
};

const TOAST_DURATION_MS = 2500;

const DEFAULT_VALUES: ContagemValidacaoForm = {
  enderecoConfirmado: '',
  sscc: '',
  enderecoVazio: false,
  anomaliaEncontrada: false,
  quantidadeCaixas: 0,
  quantidadeUnidades: 0,
  lote: '',
  peso: undefined,
};

export interface UseContagemValidacaoOptions {
  onComplete?: () => void;
  demandaId?: string;
  demandaEnderecoId?: string;
}

export function useContagemValidacao(options: UseContagemValidacaoOptions = {}) {
  const { onComplete, demandaId, demandaEnderecoId } = options;
  const [toast, setToast] = useState<ContagemValidacaoToast | null>(null);
  const [matchConfirmed, setMatchConfirmed] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<ContagemValidacaoForm>({
    resolver: zodResolver(contagemValidacaoFormSchema),
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
    (message: string, variant: ContagemValidacaoToast['variant']) => {
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

  const onEnderecoVazio = useCallback(async () => {
    hapticMedium();
    try {
      if (demandaId && demandaEnderecoId) {
        await submitContagemValidacao(demandaId, demandaEnderecoId, {
          enderecoVazio: true,
          anomaliaEncontrada: false,
          quantidadeCaixas: 0,
          quantidadeUnidades: 0,
        });
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }
      showToast('Endereço vazio registrado com sucesso.', 'success');
      reset(DEFAULT_VALUES);
      onComplete?.();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Erro ao registrar endereço vazio',
        'error',
      );
    }
  }, [demandaEnderecoId, demandaId, onComplete, reset, showToast]);

  const onAnomalia = useCallback(async () => {
    hapticMedium();
    try {
      if (demandaId && demandaEnderecoId) {
        await submitContagemValidacao(demandaId, demandaEnderecoId, {
          enderecoVazio: false,
          anomaliaEncontrada: true,
          quantidadeCaixas: 0,
          quantidadeUnidades: 0,
        });
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }
      showToast('Anomalia registrada para revisão posterior.', 'success');
      reset(DEFAULT_VALUES);
      onComplete?.();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Erro ao registrar anomalia',
        'error',
      );
    }
  }, [demandaEnderecoId, demandaId, onComplete, reset, showToast]);

  const onCorresponde = useCallback(async () => {
    hapticMedium();
    setMatchConfirmed(true);
    try {
      if (demandaId && demandaEnderecoId) {
        await submitContagemValidacao(demandaId, demandaEnderecoId, {
          enderecoVazio: false,
          anomaliaEncontrada: false,
          quantidadeCaixas: 0,
          quantidadeUnidades: PRODUTO_VALIDACAO_MOCK.quantidadeEsperada,
        });
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }
      showToast(
        `Contagem confirmada com sucesso: ${PRODUTO_VALIDACAO_MOCK.quantidadeEsperada} unidades.`,
        'success'
      );
      setMatchConfirmed(false);
      reset(DEFAULT_VALUES);
      onComplete?.();
    } catch (error) {
      setMatchConfirmed(false);
      showToast(
        error instanceof Error ? error.message : 'Erro ao confirmar contagem',
        'error',
      );
    }
  }, [demandaEnderecoId, demandaId, onComplete, reset, showToast]);

  const onCorrigir = useCallback(
    form.handleSubmit(async (data) => {
      if (!data.sscc?.trim()) {
        showToast('Informe o SSCC do palete.', 'error');
        return;
      }

      const totalUnidades =
        (Number(data.quantidadeCaixas) || 0) + (Number(data.quantidadeUnidades) || 0);

      if (totalUnidades <= 0 && !data.lote?.trim() && !data.peso) {
        showToast('Informe a quantidade real encontrada.', 'error');
        return;
      }

      const confirmed = window.confirm(
        `Deseja registrar divergência de ${totalUnidades || 0} unidades?`
      );
      if (!confirmed) return;

      hapticMedium();
      try {
        if (demandaId && demandaEnderecoId) {
          await submitContagemValidacao(demandaId, demandaEnderecoId, {
            enderecoConfirmado: data.enderecoConfirmado,
            sscc: data.sscc,
            enderecoVazio: false,
            anomaliaEncontrada: true,
            quantidadeCaixas: Number(data.quantidadeCaixas) || 0,
            quantidadeUnidades: Number(data.quantidadeUnidades) || 0,
            lote: data.lote,
            peso: data.peso,
          });
        } else {
          await new Promise((r) => setTimeout(r, 400));
        }
        showToast('Divergência registrada. O inventário foi atualizado.', 'success');
        reset(DEFAULT_VALUES);
        onComplete?.();
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Erro ao registrar divergência',
          'error',
        );
      }
    }),
    [demandaEnderecoId, demandaId, form, onComplete, reset, showToast],
  );

  return {
    state: {
      produto: PRODUTO_VALIDACAO_MOCK,
      form,
      isSubmitting: form.formState.isSubmitting,
      matchConfirmed,
      toast,
    },
    actions: {
      onEnderecoVazio,
      onAnomalia,
      onCorresponde,
      onCorrigir,
      dismissToast,
    },
  };
}
