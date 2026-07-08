import { zodResolver } from '@hookform/resolvers/zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useOfflineMutation } from '@/lib/offline/hooks/use-offline-mutation';
import { usePhotoCapture } from '@/lib/offline/hooks/use-photo-capture';
import { useUnidade } from '@/features/unidade';

import {
  AVARIA_CAUSA_OPTIONS,
  AVARIA_NATUREZA_OPTIONS,
  AVARIA_TIPO_OPTIONS,
} from '../lib/avaria-labels';
import {
  addAvariaRegistrada,
  createAvariaId,
  getAvariasRegistradas,
} from '../lib/conferencia-avarias-store';
import { getConferenciaItemSession } from '../lib/conferencia-sku-session';
import { buildAvariaRelatedId } from '../lib/avaria-evidencia-utils';
import {
  resolveConferidoTotaisForSku,
  validateAvariaQuantidadeForSkus,
} from '../lib/avaria-quantidade';
import {
  fetchParametrosDevolucaoConferencia,
  getCachedParametrosDevolucaoConferencia,
} from '../lib/devolucao-config';
import { listConferenciaRascunhos } from '../lib/devolucao-conferencia-rascunho';
import { getSkuItemsByDemandId } from '../lib/devolucao-sku-items';
import {
  buildAvariaSchema,
  DEFAULT_PARAMETROS_DEVOLUCAO_CONFERENCIA,
  type AvariaForm,
  type ParametrosDevolucaoConferencia,
} from '../types/devolucao.schema';
import { useDemandaDetalhe, useDemandById } from './use-demand-by-id';

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
  const detalhe = useDemandaDetalhe(demandId);
  const { unidadeSelecionada } = useUnidade();
  const session = getConferenciaItemSession(demandId);
  const { mutate, isPending: isSubmitting } = useOfflineMutation();
  const [avariasRegistradas, setAvariasRegistradas] = useState(() =>
    getAvariasRegistradas(demandId),
  );
  const [parametrosConferencia, setParametrosConferencia] =
    useState<ParametrosDevolucaoConferencia>(() =>
      unidadeSelecionada?.id
        ? getCachedParametrosDevolucaoConferencia(unidadeSelecionada.id)
        : DEFAULT_PARAMETROS_DEVOLUCAO_CONFERENCIA,
    );

  const items =
    useLiveQuery(
      () => getSkuItemsByDemandId(demandId),
      [demandId, detalhe?.cachedAt],
    ) ?? [];

  const avariaFormSchema = useMemo(
    () => buildAvariaSchema(parametrosConferencia.quantidadeModo),
    [parametrosConferencia.quantidadeModo],
  );

  const form = useForm<AvariaForm>({
    resolver: zodResolver(avariaFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    form.clearErrors();
  }, [avariaFormSchema, form]);

  useEffect(() => {
    setAvariasRegistradas(getAvariasRegistradas(demandId));
  }, [demandId]);

  useEffect(() => {
    if (!unidadeSelecionada?.id) {
      return;
    }

    void fetchParametrosDevolucaoConferencia(unidadeSelecionada.id).then(
      setParametrosConferencia,
    );
  }, [unidadeSelecionada?.id]);

  const itensConferidos = useMemo(
    () => items.filter((item) => item.status === 'conferido'),
    [items],
  );
  const podeReplicar = itensConferidos.length > 0;

  const activeItem = useMemo(() => {
    if (session?.itemId) {
      return items.find((item) => item.itemId === session.itemId);
    }

    if (session?.sku) {
      return items.find(
        (item) => item.sku.toLowerCase() === session.sku.toLowerCase(),
      );
    }

    return itensConferidos[0];
  }, [items, itensConferidos, session?.itemId, session?.sku]);

  const avariaRelatedId = useMemo(
    () => buildAvariaRelatedId(demandId, activeItem?.sku ?? session?.sku),
    [activeItem?.sku, demandId, session?.sku],
  );

  const { photos, capture, remove, getPhotoIds, hiddenInput } = usePhotoCapture({
    relatedId: avariaRelatedId,
  });

  const conferenciaRascunhos = useLiveQuery(
    () => listConferenciaRascunhos(demandId),
    [demandId],
  ) ?? [];

  const conferidoTotais = useMemo(() => {
    const sku = activeItem?.sku ?? session?.sku;
    if (!sku) {
      return { caixa: 0, unidade: 0, hasConferencia: false };
    }

    return resolveConferidoTotaisForSku({
      sku,
      items,
      conferenciaRascunhos,
      detalhe,
      quantidadeModo: parametrosConferencia.quantidadeModo,
    });
  }, [
    activeItem?.sku,
    conferenciaRascunhos,
    detalhe,
    items,
    parametrosConferencia.quantidadeModo,
    session?.sku,
  ]);

  const resolveSkusParaValidacao = useCallback(
    (replicar: boolean) => {
      if (replicar && podeReplicar) {
        return [...new Set(itensConferidos.map((item) => item.sku))];
      }

      const sku = activeItem?.sku ?? session?.sku;
      return sku ? [sku] : [];
    },
    [activeItem?.sku, itensConferidos, podeReplicar, session?.sku],
  );

  const validateQuantidadeLimites = useCallback(
    (values: AvariaForm, replicar: boolean) => {
      const skus = resolveSkusParaValidacao(replicar);
      if (skus.length === 0) {
        return null;
      }

      return validateAvariaQuantidadeForSkus({
        skus,
        quantidadeCaixa: values.quantidadeCaixa,
        quantidadeUnidade: values.quantidadeUnidade,
        items,
        conferenciaRascunhos,
        detalhe,
        quantidadeModo: parametrosConferencia.quantidadeModo,
        avariasRegistradas,
      });
    },
    [
      avariasRegistradas,
      conferenciaRascunhos,
      detalhe,
      items,
      parametrosConferencia.quantidadeModo,
      resolveSkusParaValidacao,
    ],
  );

  const replicarParaTodosConferidos = form.watch('replicarParaTodosConferidos') ?? false;
  const quantidadeCaixa = form.watch('quantidadeCaixa') ?? 0;
  const quantidadeUnidade = form.watch('quantidadeUnidade') ?? 0;

  useEffect(() => {
    const replicar = replicarParaTodosConferidos && podeReplicar;
    const error = validateQuantidadeLimites(
      {
        ...form.getValues(),
        quantidadeCaixa,
        quantidadeUnidade,
        replicarParaTodosConferidos: replicar,
      },
      replicar,
    );

    if (error) {
      form.setError(error.field, { message: error.message });
      return;
    }

    form.clearErrors(['quantidadeCaixa', 'quantidadeUnidade']);
  }, [
    form,
    podeReplicar,
    quantidadeCaixa,
    quantidadeUnidade,
    replicarParaTodosConferidos,
    validateQuantidadeLimites,
    avariasRegistradas,
  ]);

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
    const unidadeId = unidadeSelecionada?.id;
    if (!unidadeId) {
      return;
    }

    const photoIds = getPhotoIds();
    const label = `Avaria ${demand?.id ?? demandId}`;
    const replicar = values.replicarParaTodosConferidos && podeReplicar;
    const quantidadeError = validateQuantidadeLimites(values, replicar);

    if (quantidadeError) {
      form.setError(quantidadeError.field, { message: quantidadeError.message });
      return;
    }

    const skusAfetados = replicar
      ? itensConferidos.map((item) => item.sku)
      : activeItem?.sku
        ? [activeItem.sku]
        : session?.sku
          ? [session.sku]
          : [];

    await mutate({
      endpoint: `/devolucao/demandas/${encodeURIComponent(demandId)}/avarias`,
      method: 'POST',
      payload: {
        unidadeId,
        itemId: activeItem?.itemId ?? null,
        tipo: values.tipo,
        natureza: values.natureza,
        causa: values.causa,
        quantidadeCaixa: values.quantidadeCaixa,
        quantidadeUnidade: values.quantidadeUnidade,
        replicarSkus: replicar
          ? itensConferidos.map((item) => item.sku)
          : activeItem?.sku
            ? [activeItem.sku]
            : [],
      },
      photoIds,
      label,
    });

    addAvariaRegistrada(demandId, {
      id: createAvariaId(),
      sku: activeItem?.sku ?? session?.sku,
      skusAfetados: replicar ? skusAfetados : undefined,
      quantidadeCaixa: values.quantidadeCaixa,
      quantidadeUnidade: values.quantidadeUnidade,
      tipo: values.tipo,
      natureza: values.natureza,
      causa: values.causa,
      photoCount: photoIds.length,
      replicado: replicar,
    });
    setAvariasRegistradas(getAvariasRegistradas(demandId));

    form.reset(DEFAULT_VALUES);
    await clearPhotos();
  });

  const displayItem = activeItem ?? {
    sku: session?.sku ?? '—',
    name: 'Item não identificado',
  };

  return {
    state: {
      demandId,
      demand,
      item: {
        sku: displayItem.sku,
        description: displayItem.name,
        location: detalhe?.transporteId ?? '—',
        cargoRef: demand ? `Carga ${demand.id}` : demandId,
      },
      conferidoTotais,
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
      parametrosConferencia,
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
