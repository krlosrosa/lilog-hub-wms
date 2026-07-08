import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { hapticMedium } from '@/lib/haptics';

import {
  direcionamentoSchema,
  type DirecionamentoForm,
} from '../types/movimentacao.schema';
import { useTarefaById } from './use-tarefa-by-id';

const PROGRESS_PERCENT = 75;

export function useDirecionamento(tarefaId: string) {
  const navigate = useNavigate();
  const tarefa = useTarefaById(tarefaId);

  const form = useForm<DirecionamentoForm>({
    resolver: zodResolver(direcionamentoSchema),
    defaultValues: { destinoQrCode: '' },
    mode: 'onChange',
  });

  const destinoQrCode = form.watch('destinoQrCode');

  const isDestinoValid = useMemo(
    () =>
      destinoQrCode.trim().toUpperCase() ===
      (tarefa?.destinoQrExpected ?? '').toUpperCase(),
    [destinoQrCode, tarefa?.destinoQrExpected]
  );

  const onConfirmar = useCallback(
    form.handleSubmit(async () => {
      if (!isDestinoValid) return;
      hapticMedium();
      await new Promise((r) => setTimeout(r, 400));
      void navigate({
        to: '/movimentacao/ressuprimento/$id/conclusao',
        params: { id: tarefaId },
      });
    }),
    [form, isDestinoValid, navigate, tarefaId]
  );

  return {
    state: {
      tarefa,
      form,
      progressPercent: PROGRESS_PERCENT,
      isDestinoValid,
      isReady: isDestinoValid,
      isSubmitting: form.formState.isSubmitting,
    },
    actions: {
      onConfirmar,
    },
  };
}
