import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { isApiConfigured } from '@/lib/offline/api-client';
import { useOfflineMutation } from '@/lib/offline/hooks/use-offline-mutation';
import { usePhotoCapture } from '@/lib/offline/hooks/use-photo-capture';

import {
  AVARIA_CAUSA_OPTIONS,
  AVARIA_NATUREZA_OPTIONS,
  AVARIA_TIPO_OPTIONS,
} from '../lib/avaria-labels';
import { addAvariaRegistrada } from '../lib/conferencia-avarias-store';
import { getConferenciaContextStore } from '../lib/conferencia-context-store';
import { getConferenciaSkuSession } from '../lib/conferencia-sku-session';
import { mapAvariaApiToRegistro } from '../lib/map-avaria-api';
import { submitAvaria } from '../lib/recebimento-api';
import { uploadAvariaPhotos } from '../lib/upload-avaria-photos';
import { avariaSchema, type AvariaForm } from '../types/recebimento.schema';
import { useDemandById } from './use-demand-by-id';
import { getSkuItemsByDemandId } from './use-lista-itens';

const DEFAULT_VALUES: AvariaForm = {
  quantidadeCaixa: 0,
  quantidadeUnidade: 0,
  tipo: '',
  natureza: '',
  causa: '',
  replicarParaTodosConferidos: false,
};

const MIN_PHOTOS = 2;

export function useAvaria(demandId: string) {
  const demand = useDemandById(demandId);
  const { photos, capture, remove, getPhotoIds, hiddenInput } = usePhotoCapture({
    relatedId: `avaria-${demandId}`,
  });
  const { mutate, isPending: isOfflinePending } = useOfflineMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<AvariaForm>({
    resolver: zodResolver(avariaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const itensConferidos = useMemo(
    () => getSkuItemsByDemandId(demandId).filter((item) => item.status === 'conferido'),
    [demandId],
  );

  const activeSku = useMemo(() => {
    return getConferenciaSkuSession(demandId) ?? itensConferidos[0]?.sku ?? '';
  }, [demandId, itensConferidos]);

  const replicarParaTodosConferidos = form.watch('replicarParaTodosConferidos') ?? false;
  const podeReplicar = itensConferidos.length > 0;

  const recebimentoId =
    getConferenciaContextStore(demandId)?.recebimentoId ??
    demand?.recebimentoId ??
    null;

  const adjustQuantidade = (
    field: 'quantidadeCaixa' | 'quantidadeUnidade',
    delta: number,
  ) => {
    const raw = form.getValues(field);
    const current = Number(raw) || 0;
    const next = Math.max(0, current + delta);
    form.setValue(field, next, { shouldValidate: true, shouldDirty: true });
  };

  const clearPhotos = useCallback(async () => {
    await Promise.all(photos.map((photo) => remove(photo.id)));
  }, [photos, remove]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!recebimentoId) {
      form.setError('quantidadeCaixa', {
        message: 'Recebimento não iniciado para esta carga',
      });
      return;
    }

    const photoIds = getPhotoIds();
    if (photoIds.length < MIN_PHOTOS) {
      setSubmitError(`Anexe pelo menos ${MIN_PHOTOS} fotos de evidência`);
      return;
    }

    setSubmitError(null);
    const label = `Avaria ${demand?.id ?? demandId}`;
    const replicar = values.replicarParaTodosConferidos && podeReplicar;
    const skusAlvo = replicar
      ? itensConferidos.map((item) => item.sku)
      : activeSku
        ? [activeSku]
        : [];

    const payload = {
      tipo: values.tipo,
      natureza: values.natureza,
      causa: values.causa,
      quantidadeCaixas: values.quantidadeCaixa,
      quantidadeUnidades: values.quantidadeUnidade,
      photoCount: photoIds.length,
      replicarParaTodos: replicar,
      skusAlvo,
    };

    if (isApiConfigured() && navigator.onLine) {
      setIsSubmitting(true);
      try {
        await uploadAvariaPhotos(recebimentoId, photoIds);
        const result = await submitAvaria(recebimentoId, payload);

        for (const item of result.items) {
          addAvariaRegistrada(demandId, mapAvariaApiToRegistro(item));
        }

        form.reset(DEFAULT_VALUES);
        await clearPhotos();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Falha ao registrar avaria';
        setSubmitError(message);
        return;
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      await mutate({
        endpoint: `/recebimentos/${recebimentoId}/avarias`,
        method: 'POST',
        payload,
        photoIds,
        label,
      });

      form.reset(DEFAULT_VALUES);
      await clearPhotos();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao registrar avaria';
      setSubmitError(message);
    }
  });

  return {
    state: {
      demandId,
      demand,
      item: {
        sku: activeSku || '—',
        description:
          getConferenciaContextStore(demandId)?.itemMetaBySku[
            activeSku.toLowerCase()
          ]?.descricao ??
          itensConferidos.find((i) => i.sku === activeSku)?.name ??
          'Item conferido',
        received: 0,
        location: demand?.dock ?? '—',
        cargoRef: demand ? `Carga ${demand.id}` : `Carga ${demandId}`,
      },
      form,
      photos,
      isSubmitting: isSubmitting || isOfflinePending,
      submitError,
      errors: form.formState.errors,
      minPhotos: MIN_PHOTOS,
      tipoOptions: AVARIA_TIPO_OPTIONS,
      naturezaOptions: AVARIA_NATUREZA_OPTIONS,
      causaOptions: AVARIA_CAUSA_OPTIONS,
      replicarParaTodosConferidos,
      itensConferidosCount: itensConferidos.length,
      podeReplicar,
      recebimentoId,
    },
    actions: {
      capture,
      removePhoto: remove,
      handleSubmit,
      register: form.register,
      adjustQuantidade,
      hiddenInput,
    },
  };
}
