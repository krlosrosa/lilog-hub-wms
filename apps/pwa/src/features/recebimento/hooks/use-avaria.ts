import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useUnidade } from '@/features/unidade';
import { getChecklistDraft } from '@/lib/offline/checklist-cache';
import { db } from '@/lib/offline/db';
import { saveAvariasForDemand, loadAvariasForDemand } from '@/lib/offline/avaria-cache';
import { usePhotoCapture } from '@/lib/offline/hooks/use-photo-capture';

import {
  AVARIA_CAUSA_OPTIONS,
  AVARIA_NATUREZA_OPTIONS,
  AVARIA_TIPO_OPTIONS,
} from '../lib/avaria-labels';
import {
  createAvariaId,
  getAvariasRegistradas,
  setAvariasRegistradas as replaceAvariasRegistradas,
} from '../lib/conferencia-avarias-store';
import { peekConferenciaNavigation } from '../lib/conferencia-conferidos-store';
import { getConferenciaContextStore } from '../lib/conferencia-context-store';
import {
  getConferenciaSkuSession,
  setConferenciaEntryStep,
} from '../lib/conferencia-sku-session';
import { buildLotesDisponiveisPorProduto } from '../lib/build-paletes-conferidos-resumo';
import { buildAvariaRelatedId } from '../lib/avaria-evidencia-utils';
import { validateAvariaQuantidadeForSkus } from '../lib/avaria-quantidade';
import {
  fetchParametrosRecebimentoConferencia,
  getCachedParametrosRecebimentoConferencia,
} from '../lib/recebimento-config';
import {
  getRecebimentoConferenciaRascunho,
  listRecebimentoConferenciaRascunhos,
} from '../lib/recebimento-conferencia-rascunho';
import { resolveConferidoTotaisForSkuRecebimento } from '../lib/resolve-conferido-totais';
import {
  buildAvariaSchema,
  DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA,
  type AvariaForm,
  type AvariaRegistro,
  type ParametrosRecebimentoConferencia,
} from '../types/recebimento.schema';
import { useDemandById } from './use-demand-by-id';
import { getSkuItemsByDemandId } from './use-lista-itens';

const DEFAULT_VALUES: AvariaForm = {
  quantidadeCaixa: 0,
  quantidadeUnidade: 0,
  lote: '',
  tipo: '',
  natureza: '',
  causa: '',
  replicarParaTodosConferidos: false,
};

const MIN_PHOTOS = 2;

export function useAvaria(demandId: string) {
  const navigate = useNavigate();
  const demand = useDemandById(demandId);
  const { unidadeSelecionada } = useUnidade();

  const itensConferidos = useMemo(
    () => getSkuItemsByDemandId(demandId).filter((item) => item.status === 'conferido'),
    [demandId],
  );

  const activeSku = useMemo(() => {
    return getConferenciaSkuSession(demandId) ?? itensConferidos[0]?.sku ?? '';
  }, [demandId, itensConferidos]);

  const avariaRelatedId = useMemo(
    () => buildAvariaRelatedId(demandId, activeSku),
    [activeSku, demandId],
  );

  const {
    photos,
    capture,
    remove,
    getPhotoIds,
    hiddenInput,
    captureError,
    isProcessing,
  } = usePhotoCapture({
    relatedId: avariaRelatedId,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [avariasRegistradas, setAvariasRegistradas] = useState(() =>
    getAvariasRegistradas(demandId),
  );
  const [parametrosConferencia, setParametrosConferencia] =
    useState<ParametrosRecebimentoConferencia>(() => {
      const unidadeId = unidadeSelecionada?.id ?? demand?.unidadeId;
      return unidadeId
        ? getCachedParametrosRecebimentoConferencia(unidadeId)
        : DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA;
    });

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
    const unidadeId = unidadeSelecionada?.id ?? demand?.unidadeId;
    if (!unidadeId) return;

    setParametrosConferencia(getCachedParametrosRecebimentoConferencia(unidadeId));
    void fetchParametrosRecebimentoConferencia(unidadeId).then(setParametrosConferencia);
  }, [demand?.unidadeId, unidadeSelecionada?.id]);

  const activeProdutoId = useMemo(() => {
    const context = getConferenciaContextStore(demandId);
    return context?.itemMetaBySku[activeSku.toLowerCase()]?.produtoId ?? null;
  }, [activeSku, demandId]);

  const rascunho = useLiveQuery(
    () =>
      activeSku
        ? getRecebimentoConferenciaRascunho(demandId, activeSku)
        : undefined,
    [demandId, activeSku],
  );

  const resolvedProdutoId = activeProdutoId ?? rascunho?.produtoId ?? null;

  const lotesDisponiveis = useMemo(() => {
    const lotes = new Set<string>();

    for (const lote of rascunho?.lotes ?? []) {
      const value = lote.lote?.trim();
      if (value) {
        lotes.add(value);
      }
    }

    const context = getConferenciaContextStore(demandId);
    if (resolvedProdutoId && context) {
      const conferidos =
        context.conferidosDetalheByProdutoId?.[resolvedProdutoId] ?? [];

      for (const lote of buildLotesDisponiveisPorProduto(
        conferidos,
        resolvedProdutoId,
      )) {
        lotes.add(lote);
      }
    }

    return [...lotes].sort((a, b) => a.localeCompare(b));
  }, [demandId, rascunho?.lotes, resolvedProdutoId]);

  const exigeSelecaoLote = lotesDisponiveis.length > 1;

  useEffect(() => {
    if (lotesDisponiveis.length === 1) {
      form.setValue('lote', lotesDisponiveis[0]!, { shouldValidate: true });
    }
  }, [form, lotesDisponiveis]);

  const conferenciaRascunhos = useLiveQuery(
    () => listRecebimentoConferenciaRascunhos(demandId),
    [demandId],
  ) ?? [];

  const conferidoTotais = useMemo(
    () =>
      resolveConferidoTotaisForSkuRecebimento({
        demandId,
        sku: activeSku,
        quantidadeModo: parametrosConferencia.quantidadeModo,
        rascunhoLotes: rascunho?.lotes,
      }),
    [
      activeSku,
      demandId,
      parametrosConferencia.quantidadeModo,
      rascunho?.lotes,
    ],
  );

  const replicarParaTodosConferidos = form.watch('replicarParaTodosConferidos') ?? false;
  const quantidadeCaixa = form.watch('quantidadeCaixa') ?? 0;
  const quantidadeUnidade = form.watch('quantidadeUnidade') ?? 0;
  const podeReplicar = itensConferidos.length > 0;

  const resolveSkusParaValidacao = useCallback(
    (replicar: boolean) => {
      if (replicar && podeReplicar) {
        return [...new Set(itensConferidos.map((item) => item.sku))];
      }

      return activeSku ? [activeSku] : [];
    },
    [activeSku, itensConferidos, podeReplicar],
  );

  const validateQuantidadeLimites = useCallback(
    (values: AvariaForm, replicar: boolean) => {
      const skus = resolveSkusParaValidacao(replicar);
      if (skus.length === 0) {
        return null;
      }

      return validateAvariaQuantidadeForSkus({
        demandId,
        skus,
        quantidadeCaixa: values.quantidadeCaixa,
        quantidadeUnidade: values.quantidadeUnidade,
        quantidadeModo: parametrosConferencia.quantidadeModo,
        avariasRegistradas,
        rascunhos: conferenciaRascunhos,
      });
    },
    [
      avariasRegistradas,
      conferenciaRascunhos,
      demandId,
      parametrosConferencia.quantidadeModo,
      resolveSkusParaValidacao,
    ],
  );

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
    avariasRegistradas,
    form,
    podeReplicar,
    quantidadeCaixa,
    quantidadeUnidade,
    replicarParaTodosConferidos,
    validateQuantidadeLimites,
  ]);

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

  const navigateToConferencia = useCallback(() => {
    const navigation = peekConferenciaNavigation(demandId);
    setConferenciaEntryStep(demandId, navigation?.step ?? 3);
    void navigate({
      to: '/recebimento/$id/',
      params: { id: demandId },
      search: { init: String(Date.now()) },
    });
  }, [demandId, navigate]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const checklistDraft = await getChecklistDraft(demandId);
    const resolvedRecebimentoId =
      getConferenciaContextStore(demandId)?.recebimentoId ??
      demand?.recebimentoId ??
      checklistDraft?.recebimentoId ??
      null;

    const photoIds = getPhotoIds();
    if (photoIds.length < MIN_PHOTOS) {
      setSubmitError(`Anexe pelo menos ${MIN_PHOTOS} fotos de evidência`);
      return;
    }

    setSubmitError(null);
    const replicar = values.replicarParaTodosConferidos && podeReplicar;

    if (!activeSku.trim()) {
      setSubmitError('Selecione um produto conferido para registrar a avaria');
      return;
    }

    if (!conferidoTotais.hasConferencia) {
      setSubmitError('Conferir o item antes de registrar avaria');
      return;
    }

    const quantidadeError = validateQuantidadeLimites(values, replicar);

    if (quantidadeError) {
      form.setError(quantidadeError.field, { message: quantidadeError.message });
      return;
    }

    if (!replicar && exigeSelecaoLote && !values.lote?.trim()) {
      form.setError('lote', { message: 'Selecione o lote avariado' });
      return;
    }

    const skusAlvo = replicar
      ? itensConferidos.map((item) => item.sku)
      : activeSku
        ? [activeSku]
        : [];

    const tempId = createAvariaId();
    const registroLocal: AvariaRegistro = {
      id: tempId,
      produtoId: resolvedProdutoId ?? undefined,
      sku: activeSku || undefined,
      lote: replicar ? undefined : values.lote?.trim() || undefined,
      skusAfetados: replicar && skusAlvo.length > 0 ? skusAlvo : undefined,
      quantidadeCaixa: values.quantidadeCaixa,
      quantidadeUnidade: values.quantidadeUnidade,
      tipo: values.tipo,
      natureza: values.natureza,
      causa: values.causa,
      photoCount: photoIds.length,
      replicado: replicar,
    };

    setIsSubmitting(true);
    try {
      const cached = await loadAvariasForDemand(demandId, resolvedRecebimentoId);
      const next = cached.some((avaria) => avaria.id === registroLocal.id)
        ? cached
        : [...cached, registroLocal];

      replaceAvariasRegistradas(demandId, next);
      setAvariasRegistradas(getAvariasRegistradas(demandId));
      await saveAvariasForDemand(demandId, resolvedRecebimentoId, next);

      // Desvincula da UI, mas mantém os blobs no Dexie para o envio final.
      if (photoIds.length > 0) {
        await Promise.all(
          photoIds.map((photoId) =>
            db.photos.update(photoId, {
              relatedId: `avaria-queued-${tempId}`,
            }),
          ),
        );
      }

      form.reset(DEFAULT_VALUES);
      navigateToConferencia();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao registrar avaria';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
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
        location: demand?.dock ?? '—',
        cargoRef: demand ? `Carga ${demand.id}` : `Carga ${demandId}`,
      },
      form,
      photos,
      isSubmitting,
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
      parametrosConferencia,
      conferidoTotais,
      lotesDisponiveis,
      exigeSelecaoLote,
      captureError,
      isProcessingPhoto: isProcessing,
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
