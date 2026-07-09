import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';

import { hapticLight, hapticMedium } from '@/lib/haptics';
import { useUnidade } from '@/features/unidade';
import { isApiConfigured } from '@/lib/offline/api-client';
import { useOfflineMutation } from '@/lib/offline/hooks/use-offline-mutation';
import {
  produtoToConfig,
  produtoToMeta,
  searchProdutoWithCache,
} from '@/lib/offline/produto-cache';

import {
  clearConferenciaNavigation,
  getConferenciaSnapshot,
  peekConferenciaNavigation,
  removeConferidoItem,
  saveConferidoItem,
} from '../lib/conferencia-conferidos-store';
import {
  buildFormForLoteEntry,
  EMPTY_DETALHE_ITEM_FORM,
  hasPendingLoteDraftValues,
  resolveMaintainedLoteContext,
} from '../lib/conferencia-form';
import {
  ensureConferenciaContext,
  getConferenciaContextStore,
  saveConferenciaContextToDb,
  setConferenciaContextStore,
} from '../lib/conferencia-context-store';
import { mapConferenciaContext } from '../lib/map-conferencia-itens';
import type { ConferenciaItemMeta } from '../lib/map-conferencia-itens';
import { mapConferirPayloadFromLote } from '../lib/map-conferir-payload';
import {
  applyGs1BarcodeInput,
  looksLikeGs1Barcode,
  looksLikeGs1TraceabilityBarcode,
  parseGs1Barcode,
  resolveLoteFieldInput,
  resolvePesoInputValue,
} from '../lib/parse-gs1-barcode';
import {
  applyResumoToSkuItems,
  removeResumoConferidoLocal,
  resolveQtdFisicaFromLotes,
  upsertResumoConferidoLocal,
} from '../lib/resolve-recebimento-divergencia';
import {
  buildLotesFromConferidosApi,
  deleteRecebimentoConferenciaRascunho,
  getRecebimentoConferenciaRascunho,
  isPersistedLote,
  resolveItemRecebimentoId,
  saveRecebimentoConferenciaRascunho,
} from '../lib/recebimento-conferencia-rascunho';
import {
  fetchConferenciaContext,
} from '../lib/recebimento-api';
import {
  fetchParametrosRecebimentoConferencia,
  getCachedParametrosRecebimentoConferencia,
} from '../lib/recebimento-config';
import {
  clearPaleteSession,
  getPaleteSession,
  hasPaleteSession,
  setPaleteSession,
} from '../lib/conferencia-palete-session';
import {
  consumeConferenciaEntryStep,
  getConferenciaSkuSession,
  peekConferenciaEntryStep,
} from '../lib/conferencia-sku-session';
import { getSkuItemsByDemandId } from './use-lista-itens';
import { useDemandById } from './use-demand-by-id';
import {
  buildDetalheItemSchema,
  DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA,
  type DetalheItemForm,
  type LoteConferido,
  type ParametrosRecebimentoConferencia,
  type ProdutoConferenciaConfigForm,
} from '../types/recebimento.schema';

export type ScanTarget = 'sku' | 'idPalete' | 'etiqueta' | 'peso';

export type ConferenciaStep = 1 | 2 | 3;

const SCAN_TITLES: Record<ScanTarget, string> = {
  sku: 'Escanear SKU',
  idPalete: 'Escanear ID do palete / WMS',
  etiqueta: 'Escanear etiqueta da caixa',
  peso: 'Escanear código GS1 (peso líquido)',
};

const DEFAULT_CONFIG: ProdutoConferenciaConfigForm = {
  controlaLote: false,
  controlaValidade: false,
  controlaPeso: false,
  pesoVariavel: false,
  exigirEtiquetaPesoVariavel: false,
  controlaNumeroSerie: false,
};

function resolveInitialProdutoConfig(demandId: string): ProdutoConferenciaConfigForm {
  const sku = getConferenciaSkuSession(demandId);
  if (!sku) return DEFAULT_CONFIG;

  const meta = getConferenciaContextStore(demandId)?.itemMetaBySku[sku.toLowerCase()];
  return meta?.config ?? DEFAULT_CONFIG;
}

const EMPTY_VALUES = EMPTY_DETALHE_ITEM_FORM;

function createLoteId() {
  return `lote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveFirstFormError(errors: Record<string, { message?: string } | undefined>): string | null {
  for (const field of ['peso', 'lote', 'validade', 'etiqueta', 'recebidaCaixa', 'recebidaUnidade', 'sku', 'idPalete']) {
    const message = errors[field]?.message;
    if (message) {
      return message;
    }
  }

  return null;
}

function syncMaintainedLoteFieldsForSubmit(
  form: UseFormReturn<DetalheItemForm>,
  lotesConferidos: LoteConferido[],
  ignoreMaintainedLote: boolean,
) {
  if (ignoreMaintainedLote) {
    return;
  }

  const values = form.getValues();
  const maintained = resolveMaintainedLoteContext(values, lotesConferidos);

  if (maintained.lote && !values.lote?.trim()) {
    form.setValue('lote', maintained.lote, { shouldValidate: false });
  }

  if (maintained.validade && !values.validade?.trim()) {
    form.setValue('validade', maintained.validade, { shouldValidate: false });
  }
}

async function mergeLotesComRascunho(
  demandId: string,
  sku: string,
  produtoId: string,
  lotesNovos: LoteConferido[],
): Promise<LoteConferido[]> {
  const rascunho = await getRecebimentoConferenciaRascunho(demandId, sku);
  const existentes = rascunho?.lotes ?? [];
  const ids = new Set(existentes.map((lote) => lote.id));
  const novos = lotesNovos.filter((lote) => !ids.has(lote.id));
  const merged = [...existentes, ...novos];

  await saveRecebimentoConferenciaRascunho({
    demandId,
    sku,
    produtoId,
    lotes: merged,
  });

  return merged;
}

async function listarLotesConferenciaSku(
  demandId: string,
  sku: string,
  lotesAtuais: LoteConferido[],
): Promise<LoteConferido[]> {
  const rascunho = await getRecebimentoConferenciaRascunho(demandId, sku);
  const existentes = rascunho?.lotes ?? [];
  const ids = new Set(existentes.map((lote) => lote.id));
  const pendentes = lotesAtuais.filter((lote) => !ids.has(lote.id));
  return [...existentes, ...pendentes];
}

export function useDetalheItem(demandId: string, initKey?: string) {
  const navigate = useNavigate();
  const demand = useDemandById(demandId);
  const { unidadeSelecionada } = useUnidade();
  const { mutate, isPending: isSavingConferencia } = useOfflineMutation();
  const [parametrosConferencia, setParametrosConferencia] =
    useState<ParametrosRecebimentoConferencia>(() => {
      const unidadeId = unidadeSelecionada?.id ?? demand?.unidadeId;
      return unidadeId
        ? getCachedParametrosRecebimentoConferencia(unidadeId)
        : DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA;
    });
  const [exigePaleteConferencia, setExigePaleteConferencia] = useState<boolean>(
    () => getConferenciaContextStore(demandId)?.exigePaleteConferencia ?? false,
  );
  const controlaPalete =
    parametrosConferencia.controlaPalete || exigePaleteConferencia;
  const paleteSessionAtivo = hasPaleteSession(demandId);
  const [step, setStep] = useState<ConferenciaStep>(() => {
    if (controlaPalete) {
      return hasPaleteSession(demandId) ? 2 : 1;
    }
    return 2;
  });
  const [lotesConferidos, setLotesConferidos] = useState<LoteConferido[]>([]);
  const [lotesListExpanded, setLotesListExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null);
  const [sessionSku, setSessionSku] = useState<string | null>(() =>
    getConferenciaSkuSession(demandId),
  );
  const [produtoConfig, setProdutoConfig] = useState<ProdutoConferenciaConfigForm>(() =>
    resolveInitialProdutoConfig(demandId),
  );
  const [hasRascunhoAcumulado, setHasRascunhoAcumulado] = useState(false);
  const loteInputRef = useRef<HTMLInputElement>(null);
  const gs1InputRef = useRef<HTMLInputElement>(null);
  const [gs1WedgeValue, setGs1WedgeValue] = useState('');
  const [ignoreMaintainedLote, setIgnoreMaintainedLote] = useState(false);

  useEffect(() => {
    setSessionSku(getConferenciaSkuSession(demandId));
  }, [demandId]);

  useEffect(() => {
    const applyContext = (mapped: ReturnType<typeof mapConferenciaContext>) => {
      setExigePaleteConferencia(mapped.exigePaleteConferencia);
      setConferenciaContextStore(demandId, mapped);
    };

    if (!isApiConfigured()) {
      void ensureConferenciaContext(demandId).then((ctx) => {
        if (ctx) {
          setExigePaleteConferencia(ctx.exigePaleteConferencia);
        }
      });
      return;
    }

    void fetchConferenciaContext(demandId)
      .then(async (apiContext) => {
        const mapped = mapConferenciaContext(apiContext);
        applyContext(mapped);
        await saveConferenciaContextToDb(demandId, mapped);
      })
      .catch(async () => {
        const cached = await ensureConferenciaContext(demandId);
        if (cached) {
          setExigePaleteConferencia(cached.exigePaleteConferencia);
        }
      });
  }, [demandId]);

  useEffect(() => {
    const unidadeId = unidadeSelecionada?.id ?? demand?.unidadeId;
    if (!unidadeId) return;

    setParametrosConferencia(getCachedParametrosRecebimentoConferencia(unidadeId));
    void fetchParametrosRecebimentoConferencia(unidadeId).then(setParametrosConferencia);
  }, [demand?.unidadeId, unidadeSelecionada?.id]);

  const schema = useMemo(
    () =>
      buildDetalheItemSchema({
        pesoVariavel: produtoConfig.pesoVariavel,
        exigirEtiquetaPesoVariavel: produtoConfig.exigirEtiquetaPesoVariavel,
        quantidadeModo: parametrosConferencia.quantidadeModo,
        loteModo: parametrosConferencia.loteModo,
        controlaPalete,
      }),
    [
      produtoConfig.pesoVariavel,
      produtoConfig.exigirEtiquetaPesoVariavel,
      parametrosConferencia,
      controlaPalete,
    ],
  );
  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  const form = useForm<DetalheItemForm>({
    resolver: async (values, context, options) =>
      zodResolver(schemaRef.current)(values, context, options),
    defaultValues: EMPTY_VALUES,
  });

  const appliedInitRef = useRef<string | null>(null);
  const lotesLoadedKeyRef = useRef<string | null>(null);
  const conferenciaExistenteRef = useRef(false);

  useEffect(() => {
    form.clearErrors();
  }, [schema, form]);

  useEffect(() => {
    if (!initKey) {
      appliedInitRef.current = null;
      const sku = getConferenciaSkuSession(demandId);
      if (sku) {
        form.setValue('sku', sku, { shouldValidate: false });
      }
      const entryStep = peekConferenciaEntryStep(demandId);
      const sessionPalete = getPaleteSession(demandId);
      if (controlaPalete) {
        setStep(sessionPalete ? Math.max(2, entryStep) : entryStep);
      } else {
        setStep(entryStep === 1 ? 2 : entryStep);
      }
      consumeConferenciaEntryStep(demandId);
      return;
    }

    if (appliedInitRef.current === initKey) return;

    const navigation = peekConferenciaNavigation(demandId);
    if (navigation) {
      setLotesConferidos([]);
      const baseForm = buildFormForLoteEntry(
        navigation.form.sku,
        navigation.form.idPalete ?? '',
      );
      form.reset(
        navigation.step === 3
          ? {
              ...baseForm,
              lote: navigation.form.lote ?? '',
              validade: navigation.form.validade ?? '',
              recebidaCaixa: navigation.form.recebidaCaixa ?? '',
              recebidaUnidade: navigation.form.recebidaUnidade ?? '',
              peso: navigation.form.peso ?? '',
              etiqueta: navigation.form.etiqueta ?? '',
            }
          : baseForm,
      );
      setStep(navigation.step);
      setSessionSku(navigation.form.sku);
      clearConferenciaNavigation(demandId);
      lotesLoadedKeyRef.current = null;
      appliedInitRef.current = initKey;
      return;
    }

    const entryStep = peekConferenciaEntryStep(demandId);
    const sku = getConferenciaSkuSession(demandId);

    if (entryStep > 1 && sku) {
      const snapshot = getConferenciaSnapshot(demandId, sku);
      if (snapshot) {
        setLotesConferidos([]);
        form.reset(buildFormForLoteEntry(snapshot.sku, snapshot.idPalete ?? ''));
        setSessionSku(sku);
        setStep(entryStep);
        consumeConferenciaEntryStep(demandId);
        lotesLoadedKeyRef.current = null;
        appliedInitRef.current = initKey;
        return;
      }
    }

    if (sku) {
      form.reset(buildFormForLoteEntry(sku));
      setSessionSku(sku);
    } else {
      form.reset(EMPTY_VALUES);
      setSessionSku(null);
    }

    setLotesConferidos([]);
    lotesLoadedKeyRef.current = null;
    const sessionPalete = getPaleteSession(demandId);
    if (controlaPalete) {
      setStep(sessionPalete ? Math.max(2, entryStep) : entryStep);
    } else {
      setStep(entryStep === 1 ? 2 : entryStep);
    }
    consumeConferenciaEntryStep(demandId);
    appliedInitRef.current = initKey;
  }, [controlaPalete, demandId, form, initKey]);

  const skuValue = form.watch('sku') ?? '';
  const idPaleteValue = form.watch('idPalete') ?? '';
  const loteDraftValue = form.watch('lote') ?? '';
  const validadeDraftValue = form.watch('validade') ?? '';
  const recebidaCaixaDraftValue = form.watch('recebidaCaixa') ?? '';
  const recebidaUnidadeDraftValue = form.watch('recebidaUnidade') ?? '';
  const pesoDraftValue = form.watch('peso') ?? '';

  useEffect(() => {
    if (!controlaPalete && step === 1) {
      setStep(2);
    }
  }, [controlaPalete, step]);

  useEffect(() => {
    if (step !== 3 || !produtoConfig.pesoVariavel) {
      return;
    }

    setGs1WedgeValue('');
    const timer = window.setTimeout(() => gs1InputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, [step, produtoConfig.pesoVariavel, lotesConferidos.length]);

  useEffect(() => {
    const sessionPalete = getPaleteSession(demandId);
    if (!sessionPalete) {
      return;
    }

    form.setValue('idPalete', sessionPalete, { shouldValidate: false });
  }, [demandId, form]);

  useEffect(() => {
    lotesLoadedKeyRef.current = null;
  }, [demandId, initKey]);

  useEffect(() => {
    const resolvedSku = (skuValue.trim() || sessionSku || '').trim();
    if (!resolvedSku) {
      setLotesConferidos([]);
      return;
    }

    const loadKey = `${demandId}:${resolvedSku.toLowerCase()}:${initKey ?? 'default'}`;
    if (lotesLoadedKeyRef.current === loadKey) {
      return;
    }

    void (async () => {
      const resetLoteEntryFields = (idPalete = '') => {
        form.reset(buildFormForLoteEntry(resolvedSku, idPalete));
      };

      conferenciaExistenteRef.current = Boolean(
        getConferenciaSnapshot(demandId, resolvedSku),
      );

      const rascunho = await getRecebimentoConferenciaRascunho(
        demandId,
        resolvedSku,
      );
      if (rascunho?.lotes.length) {
        conferenciaExistenteRef.current = true;
        setHasRascunhoAcumulado(true);
        setLotesConferidos(rascunho.lotes);
        resetLoteEntryFields(
          controlaPalete
            ? getPaleteSession(demandId) ?? rascunho.lotes[0]?.idPalete ?? ''
            : rascunho.lotes[0]?.idPalete ?? '',
        );
        lotesLoadedKeyRef.current = loadKey;
        return;
      }

      const context = getConferenciaContextStore(demandId);
      const meta = context?.itemMetaBySku[resolvedSku.toLowerCase()];
      const conferidos = meta
        ? context?.conferidosDetalheByProdutoId?.[meta.produtoId]
        : undefined;

      if (conferidos?.length && meta) {
        conferenciaExistenteRef.current = true;
        setHasRascunhoAcumulado(true);
        const lotes = buildLotesFromConferidosApi(
          conferidos,
          parametrosConferencia.quantidadeModo,
          meta.unidadesPorCaixa,
        );
        setLotesConferidos(lotes);
        resetLoteEntryFields(
          controlaPalete
            ? getPaleteSession(demandId) ?? lotes[0]?.idPalete ?? ''
            : lotes[0]?.idPalete ?? '',
        );
        lotesLoadedKeyRef.current = loadKey;
        return;
      }

      setLotesConferidos([]);
      setHasRascunhoAcumulado(false);
      resetLoteEntryFields(form.getValues('idPalete') ?? '');
      lotesLoadedKeyRef.current = loadKey;
    })();
  }, [
    controlaPalete,
    demandId,
    form,
    initKey,
    parametrosConferencia.quantidadeModo,
    sessionSku,
    skuValue,
  ]);

  useEffect(() => {
    const normalizedSku = (skuValue.trim() || sessionSku || '').toLowerCase();
    if (!normalizedSku) return;

    const context = getConferenciaContextStore(demandId);
    const meta = context?.itemMetaBySku[normalizedSku];
    if (meta) {
      setProdutoConfig(meta.config);
      return;
    }

    void searchProdutoWithCache(
      demandId,
      skuValue.trim() || sessionSku || '',
    ).then((produto) => {
      if (!produto) return;
      setProdutoConfig(
        produtoToConfig(
          produto,
          parametrosConferencia.solicitarPesoPvar,
          parametrosConferencia.exigirEtiquetaPesoVariavel,
        ),
      );
    });
  }, [
    demandId,
    parametrosConferencia.solicitarPesoPvar,
    parametrosConferencia.exigirEtiquetaPesoVariavel,
    sessionSku,
    skuValue,
  ]);

  const item = useMemo(() => {
    const resolvedSku = skuValue.trim() || sessionSku;
    if (!resolvedSku) {
      return {
        sku: '',
        name: 'Selecione um SKU',
        supplier: demand?.supplier ?? '—',
        expiry: '—',
        isNovo: false,
      };
    }

    const cargoItems = getSkuItemsByDemandId(demandId);
    const fromCargo = cargoItems.find(
      (cargo) => cargo.sku.toLowerCase() === resolvedSku.toLowerCase(),
    );

    const contextMeta =
      getConferenciaContextStore(demandId)?.itemMetaBySku[
        resolvedSku.toLowerCase()
      ];

    if (fromCargo || contextMeta) {
      return {
        sku: fromCargo?.sku ?? contextMeta?.sku ?? resolvedSku,
        name: fromCargo?.name ?? contextMeta?.descricao ?? resolvedSku,
        supplier: demand?.supplier ?? '—',
        expiry: '—',
        isNovo: !fromCargo,
      };
    }

    return {
      sku: resolvedSku,
      name: 'Item novo — conferência avulsa',
      supplier: demand?.supplier ?? '—',
      expiry: '—',
      isNovo: true,
    };
  }, [demand?.supplier, demandId, sessionSku, skuValue]);

  const conferidoTotais = useMemo(
    () =>
      lotesConferidos.reduce(
        (acc, lote) => ({
          caixa: acc.caixa + lote.recebidaCaixa,
          unidade: acc.unidade + lote.recebidaUnidade,
          peso: acc.peso + (lote.peso ?? 0),
        }),
        { caixa: 0, unidade: 0, peso: 0 },
      ),
    [lotesConferidos],
  );

  const canAdvanceStep1 = controlaPalete && idPaleteValue.trim().length > 0;
  const canAdvanceStep2 = skuValue.trim().length > 0;
  const totalSteps = controlaPalete ? 3 : 2;
  const displayStep = controlaPalete ? step : ((step - 1) as ConferenciaStep);
  const minStep = controlaPalete ? 1 : 2;

  const nextStep = useCallback(() => {
    if (step === 1) {
      if (!controlaPalete) {
        setStep(2);
        return;
      }
      if (!canAdvanceStep1) {
        void form.trigger('idPalete');
        return;
      }
      hapticMedium();
      setPaleteSession(demandId, idPaleteValue);
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!canAdvanceStep2) {
        void form.trigger('sku');
        return;
      }
      hapticMedium();
      form.setValue('lote', '', { shouldValidate: false });
      form.setValue('validade', '', { shouldValidate: false });
      form.setValue('recebidaCaixa', '', { shouldValidate: false });
      form.setValue('recebidaUnidade', '', { shouldValidate: false });
      form.setValue('peso', '', { shouldValidate: false });
      form.setValue('etiqueta', '', { shouldValidate: false });
      setStep(3);
    }
  }, [canAdvanceStep1, canAdvanceStep2, controlaPalete, demandId, form, idPaleteValue, step]);

  const refreshConferenciaContextFromApi = useCallback(async () => {
    if (!isApiConfigured()) {
      return;
    }

    try {
      const apiContext = await fetchConferenciaContext(demandId);
      const mapped = mapConferenciaContext(apiContext);
      setExigePaleteConferencia(mapped.exigePaleteConferencia);
      setConferenciaContextStore(demandId, mapped);
      await saveConferenciaContextToDb(demandId, mapped);
    } catch {
      // Mantém contexto local se a API falhar.
    }
  }, [demandId]);

  const syncLocalAfterLotesChange = useCallback(
    async (
      nextLotes: LoteConferido[],
      resolvedSku: string,
      meta: ConferenciaItemMeta,
    ) => {
      setLotesConferidos(nextLotes);

      if (nextLotes.length === 0) {
        await deleteRecebimentoConferenciaRascunho(demandId, resolvedSku);
        removeConferidoItem(demandId, resolvedSku);
        setHasRascunhoAcumulado(false);
        conferenciaExistenteRef.current = false;
      } else {
        await saveRecebimentoConferenciaRascunho({
          demandId,
          sku: resolvedSku,
          produtoId: meta.produtoId,
          lotes: nextLotes,
        });
        setHasRascunhoAcumulado(true);
        conferenciaExistenteRef.current = true;
      }

      const context = getConferenciaContextStore(demandId);
      if (!context) {
        return;
      }

      const normalizedSku = resolvedSku.toLowerCase();
      const resumoConferido =
        nextLotes.length === 0
          ? removeResumoConferidoLocal({
              resumoConferido: context.resumoConferido ?? [],
              produtoId: meta.produtoId,
            })
          : upsertResumoConferidoLocal({
              resumoConferido: context.resumoConferido ?? [],
              produtoId: meta.produtoId,
              qtdFisica: resolveQtdFisicaFromLotes(
                nextLotes,
                meta.unidadesPorCaixa,
              ),
            });

      let nextItems = context.itens.map((skuItem) => {
        if (skuItem.sku.toLowerCase() !== normalizedSku) {
          return skuItem;
        }

        if (nextLotes.length === 0) {
          return {
            ...skuItem,
            status: 'pendente' as const,
            hasDivergencia: false,
            qtdEsperada: undefined,
            qtdConferida: undefined,
            quantidadeEsperada: undefined,
          };
        }

        return { ...skuItem, status: 'conferido' as const };
      });

      nextItems = applyResumoToSkuItems(
        nextItems,
        context.itemMetaBySku,
        resumoConferido,
      );

      const conferidoSkus = new Set(context.conferidoSkus);
      if (nextLotes.length === 0) {
        conferidoSkus.delete(normalizedSku);
      } else {
        conferidoSkus.add(normalizedSku);
      }

      const conferidosDetalheByProdutoId = {
        ...context.conferidosDetalheByProdutoId,
      };
      if (nextLotes.length === 0) {
        delete conferidosDetalheByProdutoId[meta.produtoId];
      }

      const nextContext = {
        ...context,
        itens: nextItems,
        resumoConferido,
        conferidoSkus,
        conferidosDetalheByProdutoId,
      };
      setConferenciaContextStore(demandId, nextContext);
      await saveConferenciaContextToDb(demandId, nextContext);
    },
    [demandId],
  );

  const resolveItemMetaForSku = useCallback(
    async (resolvedSku: string): Promise<ConferenciaItemMeta | null> => {
      const context = getConferenciaContextStore(demandId);
      const metaFromContext =
        context?.itemMetaBySku[resolvedSku.toLowerCase()] ?? null;

      if (metaFromContext) {
        return metaFromContext;
      }

      const produto = await searchProdutoWithCache(demandId, resolvedSku);
      if (!produto) {
        return null;
      }

      return produtoToMeta(
        produto,
        parametrosConferencia.solicitarPesoPvar,
        parametrosConferencia.exigirEtiquetaPesoVariavel,
      );
    },
    [
      demandId,
      parametrosConferencia.solicitarPesoPvar,
      parametrosConferencia.exigirEtiquetaPesoVariavel,
    ],
  );

  const postLotesToRecebimento = useCallback(
    async (
      lotes: LoteConferido[],
      meta: ConferenciaItemMeta,
      recebimentoId: string,
      options: { replaceExisting: boolean },
    ) => {
      const values = form.getValues();
      const resolvedSku = values.sku.trim() || sessionSku?.trim() || '';
      const fallbackIdPalete = values.idPalete?.trim() || undefined;

      if (options.replaceExisting) {
        await mutate({
          endpoint: `/recebimentos/${recebimentoId}/itens/${meta.produtoId}`,
          method: 'DELETE',
          payload: {},
          photoIds: [],
          label: `Atualizar conferência ${resolvedSku}`,
        });
      }

      for (const lote of lotes) {
        const payload = mapConferirPayloadFromLote(
          lote,
          meta,
          parametrosConferencia.loteModo,
          fallbackIdPalete,
          controlaPalete,
        );
        const loteLabel = lote.lote || lote.validade || 'sem lote';

        await mutate({
          endpoint: `/recebimentos/${recebimentoId}/itens`,
          method: 'POST',
          payload,
          photoIds: [],
          label: `Conferir ${resolvedSku} (${loteLabel})`,
        });
      }
    },
    [
      controlaPalete,
      form,
      mutate,
      parametrosConferencia.loteModo,
      sessionSku,
    ],
  );

  const prevStep = useCallback(() => {
    if (step <= minStep) return;
    hapticLight();
    setStep((s) => (s > minStep ? ((s - 1) as ConferenciaStep) : s));
  }, [minStep, step]);

  const toggleLotesListExpanded = useCallback(() => {
    setLotesListExpanded((prev) => !prev);
  }, []);

  const removeLote = useCallback(
    async (id: string) => {
      hapticLight();
      setSaveError(null);

      const values = form.getValues();
      const resolvedSku = values.sku.trim() || sessionSku?.trim() || '';
      if (!resolvedSku) {
        return;
      }

      const lote = lotesConferidos.find((entry) => entry.id === id);
      if (!lote) {
        return;
      }

      const meta = await resolveItemMetaForSku(resolvedSku);
      if (!meta) {
        setSaveError('Produto não identificado para remover lote');
        return;
      }

      const context = getConferenciaContextStore(demandId);
      const recebimentoId = context?.recebimentoId ?? demand?.recebimentoId;
      const itemRecebimentoId = resolveItemRecebimentoId(lote);

      try {
        if (recebimentoId && isApiConfigured()) {
          if (lote.pesagemId) {
            await mutate({
              endpoint: `/recebimentos/${recebimentoId}/pesagens/${lote.pesagemId}`,
              method: 'DELETE',
              payload: {},
              photoIds: [],
              label: `Remover pesagem ${resolvedSku}`,
            });
          } else if (itemRecebimentoId) {
            await mutate({
              endpoint: `/recebimentos/${recebimentoId}/itens-linha/${itemRecebimentoId}`,
              method: 'DELETE',
              payload: {},
              photoIds: [],
              label: `Remover lote ${resolvedSku}`,
            });
          }
          void refreshConferenciaContextFromApi();
        }

        const nextLotes = lotesConferidos.filter((entry) => entry.id !== id);
        await syncLocalAfterLotesChange(nextLotes, resolvedSku, meta);
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : 'Falha ao remover lote',
        );
      }
    },
    [
      demand?.recebimentoId,
      demandId,
      form,
      lotesConferidos,
      mutate,
      refreshConferenciaContextFromApi,
      resolveItemMetaForSku,
      sessionSku,
      syncLocalAfterLotesChange,
    ],
  );

  const removePalete = useCallback(
    async (idPalete: string) => {
      if (!idPalete.trim()) {
        return;
      }

      hapticLight();
      setSaveError(null);

      const values = form.getValues();
      const resolvedSku = values.sku.trim() || sessionSku?.trim() || '';
      if (!resolvedSku) {
        return;
      }

      const meta = await resolveItemMetaForSku(resolvedSku);
      if (!meta) {
        setSaveError('Produto não identificado para remover palete');
        return;
      }

      const lotesPalete = lotesConferidos.filter(
        (lote) => lote.idPalete === idPalete,
      );
      if (lotesPalete.length === 0) {
        return;
      }

      const context = getConferenciaContextStore(demandId);
      const recebimentoId = context?.recebimentoId ?? demand?.recebimentoId;
      const hasPersisted = lotesPalete.some((lote) => isPersistedLote(lote));

      try {
        if (hasPersisted && recebimentoId && isApiConfigured()) {
          await mutate({
            endpoint: `/recebimentos/${recebimentoId}/paletes/${encodeURIComponent(idPalete)}?produtoId=${encodeURIComponent(meta.produtoId)}`,
            method: 'DELETE',
            payload: {},
            photoIds: [],
            label: `Remover palete ${idPalete}`,
          });
          void refreshConferenciaContextFromApi();
        }

        const nextLotes = lotesConferidos.filter(
          (lote) => lote.idPalete !== idPalete,
        );
        await syncLocalAfterLotesChange(nextLotes, resolvedSku, meta);
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : 'Falha ao remover palete',
        );
      }
    },
    [
      demand?.recebimentoId,
      demandId,
      form,
      lotesConferidos,
      mutate,
      refreshConferenciaContextFromApi,
      resolveItemMetaForSku,
      sessionSku,
      syncLocalAfterLotesChange,
    ],
  );

  const lotesPorPalete = useMemo(() => {
    const groups = new Map<string, LoteConferido[]>();

    for (const lote of lotesConferidos) {
      const key = lote.idPalete.trim() || '__sem_palete__';
      const current = groups.get(key) ?? [];
      current.push(lote);
      groups.set(key, current);
    }

    return [...groups.entries()];
  }, [lotesConferidos]);

  const hasPendingLoteDraft = useMemo(
    () =>
      hasPendingLoteDraftValues(
        {
          lote: loteDraftValue,
          validade: validadeDraftValue,
          recebidaCaixa: recebidaCaixaDraftValue,
          recebidaUnidade: recebidaUnidadeDraftValue,
          peso: pesoDraftValue,
        },
        parametrosConferencia,
        {
          pesoVariavel: produtoConfig.pesoVariavel,
          existingLotes: lotesConferidos,
          ignoreExistingLotes: ignoreMaintainedLote,
        },
      ),
    [
      loteDraftValue,
      validadeDraftValue,
      recebidaCaixaDraftValue,
      recebidaUnidadeDraftValue,
      pesoDraftValue,
      lotesConferidos,
      parametrosConferencia,
      produtoConfig.pesoVariavel,
      ignoreMaintainedLote,
    ],
  );

  const focusLoteInput = useCallback(() => {
    window.setTimeout(() => {
      loteInputRef.current?.focus();
    }, 100);
  }, []);

  const appendLoteFromValues = useCallback(
    (values: DetalheItemForm): LoteConferido | null => {
      const paleteAtual =
        getPaleteSession(demandId)?.trim() || values.idPalete?.trim() || '';

      if (controlaPalete && !paleteAtual) {
        setSaveError('Bipe o palete antes de adicionar o lote');
        return null;
      }

      const maintained = resolveMaintainedLoteContext(values, lotesConferidos, {
        ignoreExisting: ignoreMaintainedLote,
      });
      const needsLote =
        parametrosConferencia.loteModo === 'lote' ||
        parametrosConferencia.loteModo === 'ambos';
      const needsFabricacao =
        parametrosConferencia.loteModo === 'fabricacao' ||
        parametrosConferencia.loteModo === 'ambos';

      if (
        produtoConfig.pesoVariavel &&
        produtoConfig.controlaLote &&
        needsLote &&
        !maintained.lote
      ) {
        setSaveError('Informe o lote na primeira caixa');
        return null;
      }

      if (produtoConfig.pesoVariavel && needsFabricacao && !maintained.validade) {
        setSaveError('Informe a fabricação na primeira caixa');
        return null;
      }

      return {
        id: createLoteId(),
        lote: maintained.lote,
        idPalete: paleteAtual,
        recebidaCaixa: produtoConfig.pesoVariavel ? 1 : Number(values.recebidaCaixa || 0),
        recebidaUnidade: produtoConfig.pesoVariavel ? 0 : Number(values.recebidaUnidade || 0),
        peso: values.peso ? Number(values.peso) : undefined,
        etiquetaCodigo: values.etiqueta?.trim() || undefined,
        validade: maintained.validade,
      };
    },
    [
      controlaPalete,
      demandId,
      lotesConferidos,
      parametrosConferencia.loteModo,
      produtoConfig.controlaLote,
      produtoConfig.pesoVariavel,
      ignoreMaintainedLote,
    ],
  );

  const startLoteChange = useCallback(() => {
    hapticLight();
    setIgnoreMaintainedLote(true);
    setSaveError(null);
    form.setValue('lote', '', { shouldValidate: false });
    form.setValue('validade', '', { shouldValidate: false });
    focusLoteInput();
  }, [focusLoteInput, form]);

  const focusGs1Input = useCallback(() => {
    window.setTimeout(() => {
      gs1InputRef.current?.focus();
    }, 100);
  }, []);

  const handleAddLote = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      if (produtoConfig.pesoVariavel) {
        syncMaintainedLoteFieldsForSubmit(form, lotesConferidos, ignoreMaintainedLote);
      }

      form.handleSubmit(
        async (values) => {
          setIsSubmitting(true);
          setSaveError(null);

          const entry = appendLoteFromValues(values);
          if (!entry) {
            setIsSubmitting(false);
            resolve(false);
            return;
          }

          setLotesConferidos((prev) => [...prev, entry]);
          setIgnoreMaintainedLote(false);
          form.reset(
            buildFormForLoteEntry(
              values.sku,
              entry.idPalete,
              produtoConfig.pesoVariavel
                ? { lote: entry.lote, validade: entry.validade }
                : undefined,
            ),
          );
          setIsSubmitting(false);
          if (!produtoConfig.pesoVariavel) {
            focusLoteInput();
          } else {
            focusGs1Input();
          }
          resolve(true);
        },
        (fieldErrors) => {
          const message = resolveFirstFormError(fieldErrors);
          if (message) {
            setSaveError(message);
          }
          resolve(false);
        },
      )();
    });
  }, [
    appendLoteFromValues,
    focusGs1Input,
    focusLoteInput,
    form,
    ignoreMaintainedLote,
    lotesConferidos,
    produtoConfig.pesoVariavel,
  ]);

  const appendPendingLoteBeforeAction = useCallback(async (): Promise<LoteConferido[]> => {
    const values = form.getValues();
    if (!hasPendingLoteDraftValues(values, parametrosConferencia, {
      pesoVariavel: produtoConfig.pesoVariavel,
      existingLotes: lotesConferidos,
      ignoreExistingLotes: ignoreMaintainedLote,
    })) {
      return lotesConferidos;
    }

    return new Promise((resolve, reject) => {
      if (produtoConfig.pesoVariavel) {
        syncMaintainedLoteFieldsForSubmit(form, lotesConferidos, ignoreMaintainedLote);
      }

      form.handleSubmit(
        async (validValues) => {
          const entry = appendLoteFromValues(validValues);
          if (!entry) {
            reject(new Error('palete'));
            return;
          }

          const nextLotes = [...lotesConferidos, entry];
          setLotesConferidos(nextLotes);
          setIgnoreMaintainedLote(false);
          form.reset(
            buildFormForLoteEntry(
              validValues.sku,
              entry.idPalete,
              produtoConfig.pesoVariavel
                ? { lote: entry.lote, validade: entry.validade }
                : undefined,
            ),
          );
          resolve(nextLotes);
        },
        (fieldErrors) => {
          const message = resolveFirstFormError(fieldErrors);
          if (message) {
            setSaveError(message);
          }
          reject(new Error('validation'));
        },
      )();
    });
  }, [
    appendLoteFromValues,
    form,
    ignoreMaintainedLote,
    lotesConferidos,
    parametrosConferencia,
    produtoConfig.pesoVariavel,
  ]);

  const openScan = useCallback((target: ScanTarget) => {
    hapticLight();
    setScanTarget(target);
    setScanOpen(true);
  }, []);

  const handleScanResult = useCallback(
    (text: string) => {
      if (!scanTarget) return;

      if (scanTarget === 'peso' || (scanTarget === 'etiqueta' && looksLikeGs1Barcode(text))) {
        const parsed = parseGs1Barcode(text);

        if (parsed.netWeightKg != null) {
          form.setValue('peso', resolvePesoInputValue(text), {
            shouldDirty: true,
            shouldValidate: true,
          });
        }

        if (scanTarget === 'etiqueta') {
          form.setValue('etiqueta', parsed.gtin ?? text.trim(), {
            shouldDirty: true,
            shouldValidate: true,
          });
          return;
        }

        if (parsed.netWeightKg == null) {
          form.setValue('peso', resolvePesoInputValue(text), {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
        return;
      }

      form.setValue(scanTarget, text, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form, scanTarget],
  );

  const applyGs1FromText = useCallback(
    (text: string): boolean => {
      const result = applyGs1BarcodeInput(text);
      if (!result.applied) {
        return false;
      }

      if (result.pesoKg) {
        form.setValue('peso', result.pesoKg, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (result.etiqueta) {
        form.setValue('etiqueta', result.etiqueta, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (result.lote) {
        form.setValue('lote', result.lote, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setIgnoreMaintainedLote(false);
      }

      if (result.validade) {
        form.setValue('validade', result.validade, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      hapticMedium();
      return true;
    },
    [form],
  );

  const submitLoteWedge = useCallback(
    (raw?: string) => {
      const text = (raw ?? form.getValues('lote')).trim();
      if (!text) {
        return false;
      }

      const resolved = resolveLoteFieldInput(text);
      if (looksLikeGs1TraceabilityBarcode(text) && !resolved.lote && !resolved.validade) {
        setSaveError('Código GS1 de lote inválido ou incompleto');
        return false;
      }

      setSaveError(null);

      if (resolved.lote) {
        form.setValue('lote', resolved.lote, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setIgnoreMaintainedLote(false);
      } else if (!resolved.parsedFromGs1) {
        form.setValue('lote', text.replace(/\D/g, ''), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (resolved.validade) {
        form.setValue('validade', resolved.validade, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      hapticMedium();

      if (produtoConfig.pesoVariavel) {
        focusGs1Input();
      }

      return true;
    },
    [focusGs1Input, form, produtoConfig.pesoVariavel],
  );

  const handleLoteKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') {
        return;
      }

      event.preventDefault();
      submitLoteWedge(event.currentTarget.value);
    },
    [submitLoteWedge],
  );

  const submitGs1Wedge = useCallback(
    async (raw?: string) => {
      if (isSubmitting) {
        return false;
      }

      const text = (raw ?? gs1WedgeValue).trim();
      if (!text) {
        return false;
      }

      const result = applyGs1BarcodeInput(text);
      if (!result.applied) {
        setSaveError('Código GS1 inválido ou incompleto');
        return false;
      }

      if (!result.pesoKg) {
        if (result.lote || result.validade) {
          if (result.lote) {
            form.setValue('lote', result.lote, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setIgnoreMaintainedLote(false);
          }

          if (result.validade) {
            form.setValue('validade', result.validade, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }

          setGs1WedgeValue('');
          hapticMedium();
          focusGs1Input();
          return true;
        }

        setSaveError('Código GS1 sem peso líquido (AI 3103)');
        return false;
      }

      setSaveError(null);
      form.setValue('peso', result.pesoKg, {
        shouldDirty: true,
        shouldValidate: true,
      });

      if (result.etiqueta) {
        form.setValue('etiqueta', result.etiqueta, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (result.lote) {
        form.setValue('lote', result.lote, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setIgnoreMaintainedLote(false);
      }

      if (result.validade) {
        form.setValue('validade', result.validade, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      setGs1WedgeValue('');
      hapticMedium();

      if (!produtoConfig.pesoVariavel) {
        focusGs1Input();
        return true;
      }

      const added = await handleAddLote();
      focusGs1Input();
      return added;
    },
    [
      focusGs1Input,
      form,
      gs1WedgeValue,
      handleAddLote,
      isSubmitting,
      produtoConfig.pesoVariavel,
    ],
  );

  const handleGs1WedgeKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') {
        return;
      }

      event.preventDefault();
      void submitGs1Wedge(event.currentTarget.value);
    },
    [submitGs1Wedge],
  );

  const handleFieldGs1Enter = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') {
        return;
      }

      const value = event.currentTarget.value.trim();
      if (!value || !looksLikeGs1Barcode(value)) {
        return;
      }

      if (applyGs1FromText(value)) {
        event.preventDefault();
        window.setTimeout(() => gs1InputRef.current?.focus(), 0);
      }
    },
    [applyGs1FromText],
  );

  const handlePesoInputChange = useCallback(
    (raw: string) => {
      form.setValue('peso', raw.replace(',', '.'), {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const handlePesoKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>, currentValue: string) => {
      if (event.key !== 'Enter') {
        return;
      }

      const value = currentValue.trim();
      if (!value || !looksLikeGs1Barcode(value)) {
        return;
      }

      if (applyGs1FromText(value)) {
        event.preventDefault();
      }
    },
    [applyGs1FromText],
  );

  const handleScanOpenChange = useCallback((open: boolean) => {
    setScanOpen(open);
    if (!open) {
      setScanTarget(null);
    }
  }, []);

  const scanTitle = scanTarget ? SCAN_TITLES[scanTarget] : '';
  const canRemoverConferencia =
    step === 3 && lotesConferidos.length === 0 && conferenciaExistenteRef.current;
  const canSaveConferencia =
    step === 3 &&
    (lotesConferidos.length > 0 ||
      hasPendingLoteDraft ||
      canRemoverConferencia ||
      (controlaPalete && hasRascunhoAcumulado));
  const canFecharPalete = controlaPalete && step === 3;

  const handleFecharPalete = useCallback(async () => {
    if (!canFecharPalete) {
      return;
    }

    hapticMedium();
    setSaveError(null);

    let lotesPaleteAtual: LoteConferido[];

    try {
      setIsSubmitting(true);
      lotesPaleteAtual = await appendPendingLoteBeforeAction();
    } catch {
      return;
    } finally {
      setIsSubmitting(false);
    }

    if (lotesPaleteAtual.length === 0) {
      setSaveError('Adicione pelo menos um lote antes de fechar o palete');
      return;
    }

    const values = form.getValues();
    const resolvedSku = values.sku.trim() || sessionSku?.trim() || '';
    if (!resolvedSku) {
      setSaveError('Informe o SKU do produto');
      return;
    }

    const context = getConferenciaContextStore(demandId);
    const recebimentoId = context?.recebimentoId ?? demand?.recebimentoId;
    let meta = context?.itemMetaBySku[resolvedSku.toLowerCase()] ?? null;

    if (!meta) {
      const produto = await searchProdutoWithCache(demandId, resolvedSku);
      if (!produto) {
        setSaveError('Produto não encontrado no catálogo');
        return;
      }
      meta = produtoToMeta(
        produto,
        parametrosConferencia.solicitarPesoPvar,
        parametrosConferencia.exigirEtiquetaPesoVariavel,
      );
    }

    if (!meta) {
      setSaveError('Produto não identificado para conferência');
      return;
    }

    try {
      if (recebimentoId && isApiConfigured()) {
        await postLotesToRecebimento(lotesPaleteAtual, meta, recebimentoId, {
          replaceExisting: false,
        });
        void refreshConferenciaContextFromApi();
      }

      await mergeLotesComRascunho(
        demandId,
        resolvedSku,
        meta.produtoId,
        lotesPaleteAtual,
      );
      setHasRascunhoAcumulado(true);
      conferenciaExistenteRef.current = true;

      setLotesConferidos([]);
      clearPaleteSession(demandId);
      form.setValue('idPalete', '', { shouldValidate: false });
      form.reset(buildFormForLoteEntry(resolvedSku, ''));
      lotesLoadedKeyRef.current = `${demandId}:${resolvedSku.toLowerCase()}:${initKey ?? 'default'}`;
      setStep(1);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Falha ao fechar palete',
      );
    }
  }, [
    appendPendingLoteBeforeAction,
    canFecharPalete,
    demand?.recebimentoId,
    demandId,
    form,
    initKey,
    parametrosConferencia.solicitarPesoPvar,
    postLotesToRecebimento,
    refreshConferenciaContextFromApi,
    sessionSku,
  ]);

  const handleSaveConferencia = useCallback(async () => {
    if (!canSaveConferencia) {
      setSaveError('Adicione pelo menos um lote conferido');
      return;
    }

    hapticMedium();
    setSaveError(null);

    const values = form.getValues();
    const resolvedSku = values.sku.trim() || sessionSku?.trim() || '';
    if (!resolvedSku) {
      setSaveError('Informe o SKU do produto');
      return;
    }

    const isRemovendoConferencia =
      canRemoverConferencia &&
      lotesConferidos.length === 0 &&
      !hasPendingLoteDraft;

    let lotesParaSalvar = lotesConferidos;

    if (!isRemovendoConferencia && hasPendingLoteDraft) {
      try {
        setIsSubmitting(true);
        lotesParaSalvar = await appendPendingLoteBeforeAction();
      } catch (error) {
        setSaveError(
          error instanceof Error && error.message === 'validation'
            ? 'Corrija os dados do lote antes de salvar a conferência'
            : 'Complete os dados do lote antes de salvar a conferência',
        );
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    if (!isRemovendoConferencia && lotesParaSalvar.length === 0) {
      setSaveError('Adicione pelo menos um lote conferido');
      return;
    }

    const context = getConferenciaContextStore(demandId);
    const recebimentoId = context?.recebimentoId ?? demand?.recebimentoId;

    let meta = context?.itemMetaBySku[resolvedSku.toLowerCase()] ?? null;

    if (!meta) {
      const produto = await searchProdutoWithCache(demandId, resolvedSku);
      if (!produto) {
        setSaveError('Produto não encontrado no catálogo');
        return;
      }
      meta = produtoToMeta(
        produto,
        parametrosConferencia.solicitarPesoPvar,
        parametrosConferencia.exigirEtiquetaPesoVariavel,
      );
    }

    if (!meta) {
      setSaveError('Produto não identificado para conferência');
      return;
    }

    const isRemovendoConferenciaFinal =
      canRemoverConferencia && lotesParaSalvar.length === 0;
    const lotesParaSalvarFinal = isRemovendoConferenciaFinal
      ? []
      : controlaPalete
        ? await listarLotesConferenciaSku(demandId, resolvedSku, lotesParaSalvar)
        : lotesParaSalvar;
    const totaisParaSalvar = lotesParaSalvarFinal.reduce(
      (acc, lote) => ({
        caixa: acc.caixa + lote.recebidaCaixa,
        unidade: acc.unidade + lote.recebidaUnidade,
      }),
      { caixa: 0, unidade: 0 },
    );

    const persistLocal = async () => {
      if (isRemovendoConferenciaFinal) {
        await deleteRecebimentoConferenciaRascunho(demandId, resolvedSku);
        removeConferidoItem(demandId, resolvedSku);
      } else {
        const cargoItems = getSkuItemsByDemandId(demandId);
        const fromCargo = cargoItems.find(
          (cargo) => cargo.sku.toLowerCase() === resolvedSku.toLowerCase(),
        );

        const aggregatedForm: DetalheItemForm = {
          sku: resolvedSku,
          idPalete: lotesParaSalvarFinal[0]?.idPalete ?? values.idPalete ?? '',
          lote:
            lotesParaSalvarFinal.length === 1
              ? lotesParaSalvarFinal[0]?.lote ?? ''
              : `${lotesParaSalvarFinal.length} lotes`,
          recebidaCaixa: String(totaisParaSalvar.caixa),
          recebidaUnidade: String(totaisParaSalvar.unidade),
          peso: '',
          validade:
            lotesParaSalvarFinal.length === 1
              ? lotesParaSalvarFinal[0]?.validade ?? ''
              : '',
        };

        await saveRecebimentoConferenciaRascunho({
          demandId,
          sku: resolvedSku,
          produtoId: meta!.produtoId,
          lotes: lotesParaSalvarFinal,
        });

        saveConferidoItem(demandId, {
          sku: resolvedSku,
          name: fromCargo?.name ?? meta!.descricao,
          form: aggregatedForm,
        });
      }

      const latestContext = getConferenciaContextStore(demandId) ?? context;
      if (latestContext) {
        const normalizedSku = resolvedSku.toLowerCase();
        let nextItems = latestContext.itens.map((skuItem) => {
          if (skuItem.sku.toLowerCase() !== normalizedSku) {
            return skuItem;
          }

          if (isRemovendoConferenciaFinal) {
            return {
              ...skuItem,
              status: 'pendente' as const,
              hasDivergencia: false,
              qtdEsperada: undefined,
              qtdConferida: undefined,
              quantidadeEsperada: undefined,
            };
          }

          return { ...skuItem, status: 'conferido' as const };
        });

        const resumoConferido = isRemovendoConferenciaFinal
          ? removeResumoConferidoLocal({
              resumoConferido: latestContext.resumoConferido ?? [],
              produtoId: meta!.produtoId,
            })
          : upsertResumoConferidoLocal({
              resumoConferido: latestContext.resumoConferido ?? [],
              produtoId: meta!.produtoId,
              qtdFisica: resolveQtdFisicaFromLotes(
                lotesParaSalvarFinal,
                meta!.unidadesPorCaixa,
              ),
            });

        nextItems = applyResumoToSkuItems(
          nextItems,
          latestContext.itemMetaBySku,
          resumoConferido,
        );

        const conferidoSkus = new Set(latestContext.conferidoSkus);
        if (isRemovendoConferenciaFinal) {
          conferidoSkus.delete(normalizedSku);
        } else {
          conferidoSkus.add(normalizedSku);
        }

        const conferidosDetalheByProdutoId = {
          ...latestContext.conferidosDetalheByProdutoId,
        };
        if (isRemovendoConferenciaFinal) {
          delete conferidosDetalheByProdutoId[meta!.produtoId];
        }

        const nextContext = {
          ...latestContext,
          itens: nextItems,
          resumoConferido,
          conferidoSkus,
          conferidosDetalheByProdutoId,
        };
        setConferenciaContextStore(demandId, nextContext);
        await saveConferenciaContextToDb(demandId, nextContext);
      }

      if (isRemovendoConferenciaFinal) {
        conferenciaExistenteRef.current = false;
      }
    };

    const finishSave = async () => {
      await persistLocal();
      clearConferenciaNavigation(demandId);
      await navigate({
        to: '/recebimento/$id/itens',
        params: { id: demandId },
      });
    };

    if (!recebimentoId || !isApiConfigured()) {
      await finishSave();
      return;
    }

    try {
      if (recebimentoId && isApiConfigured()) {
        if (!isRemovendoConferenciaFinal) {
          await postLotesToRecebimento(
            lotesParaSalvarFinal,
            meta,
            recebimentoId,
            { replaceExisting: true },
          );
        } else {
          await mutate({
            endpoint: `/recebimentos/${recebimentoId}/itens/${meta.produtoId}`,
            method: 'DELETE',
            payload: {},
            photoIds: [],
            label: `Remover conferência ${resolvedSku}`,
          });
        }
      }

      await persistLocal();

      if (isApiConfigured()) {
        void refreshConferenciaContextFromApi();
      }

      clearConferenciaNavigation(demandId);
      clearPaleteSession(demandId);
      await navigate({
        to: '/recebimento/$id/itens',
        params: { id: demandId },
      });
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Falha ao conferir item',
      );
    }
  }, [
    appendPendingLoteBeforeAction,
    canSaveConferencia,
    canRemoverConferencia,
    controlaPalete,
    demand?.recebimentoId,
    demandId,
    form,
    hasPendingLoteDraft,
    hasRascunhoAcumulado,
    lotesConferidos,
    mutate,
    navigate,
    parametrosConferencia.solicitarPesoPvar,
    postLotesToRecebimento,
    refreshConferenciaContextFromApi,
    sessionSku,
  ]);

  return {
    state: {
      demandId,
      step,
      item,
      form,
      lotesConferidos,
      lotesPorPalete,
      lotesListExpanded,
      isSubmitting,
      errors: form.formState.errors,
      conferidoTotais,
      hasLotesConferidos: lotesConferidos.length > 0,
      canRemoverConferencia,
      canSaveConferencia,
      canFecharPalete,
      isSavingConferencia,
      saveError,
      canAdvanceStep1,
      canAdvanceStep2,
      scanOpen,
      scanTarget,
      scanTitle,
      skuValue,
      idPaleteValue,
      produtoConfig,
      parametrosConferencia,
      totalSteps,
      displayStep,
      minStep,
      controlaPalete,
      paleteSessionAtivo,
      paleteSessionCodigo: getPaleteSession(demandId),
      loteInputRef,
      gs1InputRef,
      gs1WedgeValue,
      ignoreMaintainedLote,
    },
    actions: {
      handleAddLote,
      register: form.register,
      openScan,
      handleScanResult,
      handleScanOpenChange,
      handlePesoInputChange,
      handlePesoKeyDown,
      handleGs1WedgeKeyDown,
      handleFieldGs1Enter,
      setGs1WedgeValue,
      startLoteChange,
      handleLoteKeyDown,
      submitLoteWedge,
      toggleLotesListExpanded,
      removeLote,
      removePalete,
      handleSaveConferencia,
      handleFecharPalete,
      nextStep,
      prevStep,
      setValue: form.setValue,
    },
  };
}
