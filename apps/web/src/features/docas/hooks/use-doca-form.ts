'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { createDoca } from '@/features/docas/lib/docas-api';
import {
  DOCA_FORM_DEFAULT_VALUES,
  DOCA_FORM_TIPO_LABELS,
  docaFormSchema,
  type DocaFormValues,
} from '@/features/docas/types/doca-form.schema';
import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';

export function useDocaForm() {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const form = useForm<DocaFormValues>({
    resolver: zodResolver(docaFormSchema),
    defaultValues: {
      ...DOCA_FORM_DEFAULT_VALUES,
      unidadeId: unidadeId ?? '',
    },
    mode: 'onSubmit',
  });

  const codigo = form.watch('codigo');
  const nome = form.watch('nome');
  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (unidadeId) {
      form.setValue('unidadeId', unidadeId, { shouldValidate: true });
    }
  }, [unidadeId, form]);

  const onSubmit = form.handleSubmit(async (data: DocaFormValues) => {
    if (!unidadeId) {
      toast.error('Selecione uma unidade antes de cadastrar a doca');
      return;
    }

    try {
      await createDoca({
        unidadeId,
        codigo: data.codigo.trim(),
        nome: data.nome.trim(),
        tipo: data.tipo,
        capacidadeVeiculos: data.capacidadeVeiculos,
        observacao: data.observacao?.trim() || undefined,
      });

      toast.success('Doca cadastrada!', {
        description: `${data.codigo.trim()} — ${DOCA_FORM_TIPO_LABELS[data.tipo]}`,
      });

      router.push('/docas');
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível cadastrar a doca';

      toast.error(message);
    }
  });

  const cancelar = useCallback(() => {
    router.push('/docas');
  }, [router]);

  return {
    form,
    isSubmitting,
    unidadeSelecionada,
    onSubmit,
    cancelar,
    codigo,
    nome,
  };
}
