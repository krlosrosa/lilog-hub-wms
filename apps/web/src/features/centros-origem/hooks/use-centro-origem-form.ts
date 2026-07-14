'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  createCentroOrigem,
  getCentroOrigem,
  updateCentroOrigem,
} from '@/features/centros-origem/lib/centros-origem-api';
import {
  CENTRO_ORIGEM_FORM_DEFAULT_VALUES,
  centroOrigemFormSchema,
  type CentroOrigemFormValues,
} from '@/features/centros-origem/types/centro-origem-form.schema';
import { ApiClientError } from '@/lib/api';

type UseCentroOrigemFormOptions = {
  mode: 'create' | 'edit';
  centro?: string;
};

export function useCentroOrigemForm({
  mode,
  centro,
}: UseCentroOrigemFormOptions) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  const form = useForm<CentroOrigemFormValues>({
    resolver: zodResolver(centroOrigemFormSchema),
    defaultValues: CENTRO_ORIGEM_FORM_DEFAULT_VALUES,
    mode: 'onSubmit',
  });

  const isSubmitting = form.formState.isSubmitting;
  const isLoading = form.formState.isLoading;

  useEffect(() => {
    if (!isEdit || !centro) {
      return;
    }

    const carregar = async () => {
      form.clearErrors('root');

      try {
        const record = await getCentroOrigem(centro);
        form.reset({
          centro: record.centro,
          nome: record.nome,
        });
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível carregar o centro de origem';

        form.setError('root', { message });
        toast.error(message);
      }
    };

    void carregar();
  }, [centro, form, isEdit]);

  const onSubmit = form.handleSubmit(async (data: CentroOrigemFormValues) => {
    try {
      if (isEdit && centro) {
        await updateCentroOrigem(centro, {
          nome: data.nome.trim(),
        });

        toast.success('Centro de origem atualizado!');
      } else {
        await createCentroOrigem({
          centro: data.centro.trim(),
          nome: data.nome.trim(),
        });

        toast.success('Centro de origem cadastrado!');
      }

      router.push('/centros-origem');
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível salvar o centro de origem';

      toast.error(message);
    }
  });

  const cancelar = useCallback(() => {
    router.push('/centros-origem');
  }, [router]);

  return {
    form,
    isSubmitting,
    isLoading,
    isEdit,
    onSubmit,
    cancelar,
  };
}
