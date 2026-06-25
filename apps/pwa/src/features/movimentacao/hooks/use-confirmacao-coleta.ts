import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { hapticMedium } from '@/lib/haptics';

import {
  confirmacaoColetaSchema,
  type ConfirmacaoColetaForm,
} from '../types/movimentacao.schema';
import { useTarefaById } from './use-tarefa-by-id';

export function useConfirmacaoColeta(tarefaId: string) {
  const navigate = useNavigate();
  const tarefa = useTarefaById(tarefaId);

  const form = useForm<ConfirmacaoColetaForm>({
    resolver: zodResolver(confirmacaoColetaSchema),
    defaultValues: { enderecoOrigem: '', lpn: '' },
    mode: 'onChange',
  });

  const enderecoOrigem = form.watch('enderecoOrigem');
  const lpn = form.watch('lpn');

  const isEnderecoValid = useMemo(
    () =>
      enderecoOrigem.trim().toUpperCase() === (tarefa?.origem ?? '').toUpperCase(),
    [enderecoOrigem, tarefa?.origem]
  );

  const isLpnValid = useMemo(() => lpn.trim().length >= 6, [lpn]);

  const isReady = isEnderecoValid && isLpnValid;

  const onConfirm = useCallback(
    form.handleSubmit(async () => {
      hapticMedium();
      await new Promise((r) => setTimeout(r, 400));
      void navigate({
        to: '/movimentacao/$id/direcionamento',
        params: { id: tarefaId },
      });
    }),
    [form, navigate, tarefaId]
  );

  return {
    state: {
      tarefa,
      form,
      isEnderecoValid,
      isLpnValid,
      isReady,
      isSubmitting: form.formState.isSubmitting,
    },
    actions: {
      onConfirm,
    },
  };
}
