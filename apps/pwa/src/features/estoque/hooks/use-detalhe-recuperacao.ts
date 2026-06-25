import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { hapticMedium } from '@/lib/haptics';
import { useOfflineMutation } from '@/lib/offline/hooks/use-offline-mutation';
import { usePhotoCapture } from '@/lib/offline/hooks/use-photo-capture';

import { iniciarItem, registrarExecucao } from '../lib/recuperacao-store';
import {
  createRecuperacaoExecucaoFormSchema,
  type RecuperacaoExecucaoForm,
} from '../types/recuperacao.schema';
import {
  useRecuperacaoDemanda,
  useRecuperacaoItem,
} from './use-recuperacao-store';

export type DetalheRecuperacaoToast = {
  message: string;
  variant: 'success' | 'error';
};

export function useDetalheRecuperacao(demandaId: string, itemId: string) {
  const navigate = useNavigate();
  const demanda = useRecuperacaoDemanda(demandaId);
  const item = useRecuperacaoItem(itemId);
  const { photos, capture, remove, getPhotoIds, hiddenInput } = usePhotoCapture({
    relatedId: `recuperacao-detalhe-${demandaId}-${itemId}`,
  });
  const { mutate, isPending: isSubmitting } = useOfflineMutation();
  const [toast, setToast] = useState<DetalheRecuperacaoToast | null>(null);

  const schema = useMemo(
    () =>
      item
        ? createRecuperacaoExecucaoFormSchema(item.quantidadeRecuperar)
        : createRecuperacaoExecucaoFormSchema(0),
    [item],
  );

  const form = useForm<RecuperacaoExecucaoForm>({
    resolver: zodResolver(schema),
    defaultValues: { qtyAvariada: 0, qtyRecuperada: 0, observacao: '' },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        qtyAvariada: item.quantidadeRecuperar,
        qtyRecuperada: item.quantidadeRecuperar,
        observacao: '',
      });
    }
  }, [item?.id, item?.quantidadeRecuperar, form, item]);

  const isConcluido = item?.status === 'concluido';
  const canFinalizar = !isConcluido && !isSubmitting;

  const showToast = useCallback((next: DetalheRecuperacaoToast) => {
    setToast(next);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleFinalizarRecuperacao = form.handleSubmit(async (values) => {
    if (!item || isConcluido) return;

    const photoIds = getPhotoIds();
    const fotoDepoisUrl =
      photos.length > 0 ? photos[photos.length - 1].previewUrl : undefined;

    let demandaCompleta = false;

    try {
      if (item.status === 'pendente') {
        iniciarItem(demandaId, itemId);
      }

      await mutate({
        endpoint: `/estoque/recuperacao/demands/${demandaId}/itens/${itemId}/registrar`,
        method: 'POST',
        payload: {
          demandaId,
          itemId,
          ...values,
        },
        photoIds,
        label: `Recuperação ${demandaId} / ${item.sku}`,
        optimisticUpdate: async () => {
          demandaCompleta = registrarExecucao({
            itemId,
            demandaId,
            qtyAvariada: values.qtyAvariada,
            qtyRecuperada: values.qtyRecuperada,
            observacao: values.observacao?.trim() || undefined,
            fotoDepoisUrl,
            finalizadoEm: new Date().toISOString(),
          });
        },
      });

      hapticMedium();
      showToast({ message: 'Recuperação finalizada', variant: 'success' });

      await new Promise((resolve) => setTimeout(resolve, 800));

      if (demandaCompleta) {
        await mutate({
          endpoint: `/estoque/recuperacao/demands/${demandaId}/finalizar`,
          method: 'POST',
          payload: { demandaId },
          photoIds: [],
          label: `Finalizar demanda ${demandaId}`,
        });
        void navigate({
          to: '/estoque/recuperacao/$demandaId/resumo',
          params: { demandaId },
        });
      } else {
        void navigate({
          to: '/estoque/recuperacao/$demandaId',
          params: { demandaId },
        });
      }
    } catch {
      showToast({ message: 'Falha ao finalizar recuperação', variant: 'error' });
    }
  });

  const validateForm = useCallback(() => form.trigger(), [form]);

  return {
    state: {
      demanda,
      item,
      canFinalizar,
      isConcluido,
      isSubmitting,
      toast,
      photos,
      errors: form.formState.errors,
      qtyMaxima: item?.quantidadeRecuperar ?? 0,
      qtyAvariada: form.watch('qtyAvariada'),
      qtyRecuperada: form.watch('qtyRecuperada'),
      observacao: form.watch('observacao'),
    },
    actions: {
      finalizarRecuperacao: handleFinalizarRecuperacao,
      validateForm,
      capture,
      removePhoto: remove,
      register: form.register,
      setValue: form.setValue,
      watch: form.watch,
      hiddenInput,
    },
  };
}
