import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useOfflineMutation } from '@/lib/offline/hooks/use-offline-mutation';
import { usePhotoCapture } from '@/lib/offline/hooks/use-photo-capture';

import {
  AVARIA_CAUSA_OPTIONS,
  AVARIA_NATUREZA_OPTIONS,
  AVARIA_TIPO_OPTIONS,
} from '../lib/avaria-labels';
import {
  addAvariaRegistrada,
  createAvariaId,
} from '../lib/conferencia-avarias-store';
import { avariaSchema, type AvariaForm } from '../types/devolucao.schema';
import { useDemandById } from './use-demand-by-id';
import { getSkuItemsByDemandId } from './use-lista-itens';

const MOCK_AVARIA_ITEM = {
  sku: 'IND-99283-BL',
  description: 'Componente Eletrônico de Precisão - Lote 2024/02',
  received: 500,
  location: 'DEV-04-B',
  cargoRef: 'Carga #44920-A',
};

const DEFAULT_VALUES: AvariaForm = {
  quantidadeCaixa: 0,
  quantidadeUnidade: 0,
  tipo: '',
  natureza: '',
  causa: '',
  replicarParaTodosConferidos: false,
};

export function useAvaria(demandId: string) {
  const demand = useDemandById(demandId);
  const { photos, capture, remove, getPhotoIds, hiddenInput } = usePhotoCapture({
    relatedId: `avaria-${demandId}`,
  });
  const { mutate, isPending: isSubmitting } = useOfflineMutation();

  const form = useForm<AvariaForm>({
    resolver: zodResolver(avariaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const itensConferidos = useMemo(
    () => getSkuItemsByDemandId().filter((item) => item.status === 'conferido'),
    []
  );

  const replicarParaTodosConferidos = form.watch('replicarParaTodosConferidos') ?? false;
  const podeReplicar = itensConferidos.length > 0;

  const adjustQuantidade = (
    field: 'quantidadeCaixa' | 'quantidadeUnidade',
    delta: number
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
    const photoIds = getPhotoIds();
    const label = `Avaria ${demand?.id ?? demandId}`;
    const replicar = values.replicarParaTodosConferidos && podeReplicar;

    await mutate({
      endpoint: `/devolucao/${demandId}/avarias`,
      method: 'POST',
      payload: {
        demandId,
        ...values,
        replicarParaTodosConferidos: replicar,
        skusAlvo: replicar
          ? itensConferidos.map((item) => item.sku)
          : [MOCK_AVARIA_ITEM.sku],
      },
      photoIds,
      label,
    });

    addAvariaRegistrada(demandId, {
      id: createAvariaId(),
      quantidadeCaixa: values.quantidadeCaixa,
      quantidadeUnidade: values.quantidadeUnidade,
      tipo: values.tipo,
      natureza: values.natureza,
      causa: values.causa,
      photoCount: photoIds.length,
      replicado: replicar,
    });

    form.reset(DEFAULT_VALUES);
    await clearPhotos();
  });

  return {
    state: {
      demandId,
      demand,
      item: {
        ...MOCK_AVARIA_ITEM,
        cargoRef: demand ? `Carga ${demand.id}` : MOCK_AVARIA_ITEM.cargoRef,
      },
      form,
      photos,
      isSubmitting,
      errors: form.formState.errors,
      minPhotos: 2,
      tipoOptions: AVARIA_TIPO_OPTIONS,
      naturezaOptions: AVARIA_NATUREZA_OPTIONS,
      causaOptions: AVARIA_CAUSA_OPTIONS,
      replicarParaTodosConferidos,
      itensConferidosCount: itensConferidos.length,
      podeReplicar,
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
