import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { hapticLight, hapticMedium } from '@/lib/haptics';
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
  saveConferidoItem,
} from '../lib/conferencia-conferidos-store';
import {
  ensureConferenciaContext,
  getConferenciaContextStore,
  saveConferenciaContextToDb,
  setConferenciaContextStore,
} from '../lib/conferencia-context-store';
import { mapConferenciaContext } from '../lib/map-conferencia-itens';
import { mapConferirPayload } from '../lib/map-conferir-payload';
import { fetchConferenciaContext } from '../lib/recebimento-api';
import {
  consumeConferenciaEntryStep,
  getConferenciaSkuSession,
  peekConferenciaEntryStep,
} from '../lib/conferencia-sku-session';
import { getSkuItemsByDemandId } from './use-lista-itens';
import { useDemandById } from './use-demand-by-id';
import {
  createDetalheItemSchema,
  type DetalheItemForm,
  type LoteConferido,
  type ProdutoConferenciaConfigForm,
} from '../types/recebimento.schema';

export type ScanTarget = 'sku' | 'idPalete' | 'lote';

export type ConferenciaStep = 1 | 2 | 3;

const SCAN_TITLES: Record<ScanTarget, string> = {
  sku: 'Escanear SKU',
  idPalete: 'Escanear ID do palete / WMS',
  lote: 'Escanear lote (batch)',
};

const DEFAULT_CONFIG: ProdutoConferenciaConfigForm = {
  controlaLote: false,
  controlaValidade: false,
  controlaPeso: false,
  pesoVariavel: false,
  controlaNumeroSerie: false,
};

function resolveInitialProdutoConfig(demandId: string): ProdutoConferenciaConfigForm {
  const sku = getConferenciaSkuSession(demandId);
  if (!sku) return DEFAULT_CONFIG;

  const meta = getConferenciaContextStore(demandId)?.itemMetaBySku[sku.toLowerCase()];
  return meta?.config ?? DEFAULT_CONFIG;
}

const EMPTY_VALUES: DetalheItemForm = {
  sku: '',
  idPalete: '',
  lote: '',
  recebidaCaixa: '',
  recebidaUnidade: '',
  peso: '',
  validade: '',
};

function createLoteId() {
  return `lote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useDetalheItem(demandId: string, initKey?: string) {
  const navigate = useNavigate();
  const demand = useDemandById(demandId);
  const { mutate, isPending: isSavingConferencia } = useOfflineMutation();
  const [step, setStep] = useState<ConferenciaStep>(1);
  const [lotesConferidos, setLotesConferidos] = useState<LoteConferido[]>([]);
  const [lotesListExpanded, setLotesListExpanded] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null);
  const [sessionSku, setSessionSku] = useState<string | null>(() =>
    getConferenciaSkuSession(demandId),
  );
  const [produtoConfig, setProdutoConfig] = useState<ProdutoConferenciaConfigForm>(() =>
    resolveInitialProdutoConfig(demandId),
  );

  useEffect(() => {
    setSessionSku(getConferenciaSkuSession(demandId));
  }, [demandId]);

  useEffect(() => {
    void ensureConferenciaContext(demandId);

    if (getConferenciaContextStore(demandId) || !isApiConfigured()) return;

    void fetchConferenciaContext(demandId)
      .then(async (apiContext) => {
        const mapped = mapConferenciaContext(apiContext);
        setConferenciaContextStore(demandId, mapped);
        await saveConferenciaContextToDb(demandId, mapped);
      })
      .catch(() => {
        // Mantém fluxo local se a API falhar.
      });
  }, [demandId]);

  const schema = useMemo(
    () => createDetalheItemSchema(produtoConfig),
    [produtoConfig],
  );
  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  const form = useForm<DetalheItemForm>({
    resolver: async (values, context, options) =>
      zodResolver(schemaRef.current)(values, context, options),
    defaultValues: EMPTY_VALUES,
  });

  const appliedInitRef = useRef<string | null>(null);

  useEffect(() => {
    form.clearErrors();
  }, [schema, form]);

  useEffect(() => {
    if (initKey) {
      if (appliedInitRef.current === initKey) return;

      const navigation = peekConferenciaNavigation(demandId);
      if (navigation) {
        form.reset(navigation.form);
        setStep(navigation.step);
        setSessionSku(navigation.form.sku);
        consumeConferenciaEntryStep(demandId);
        appliedInitRef.current = initKey;
        return;
      }

      const entryStep = peekConferenciaEntryStep(demandId);
      if (entryStep > 1) {
        const sku = getConferenciaSkuSession(demandId);
        if (sku) {
          const snapshot = getConferenciaSnapshot(demandId, sku);
          if (snapshot) {
            form.reset(snapshot);
          } else {
            form.setValue('sku', sku, { shouldValidate: false });
          }
          setSessionSku(sku);
        }
        setStep(entryStep);
        consumeConferenciaEntryStep(demandId);
        appliedInitRef.current = initKey;
        return;
      }
    }

    appliedInitRef.current = null;

    const sku = getConferenciaSkuSession(demandId);
    if (sku) {
      form.setValue('sku', sku, { shouldValidate: false });
    }
    const entryStep = peekConferenciaEntryStep(demandId);
    setStep(entryStep);
    consumeConferenciaEntryStep(demandId);
  }, [demandId, initKey, form]);

  const skuValue = form.watch('sku') ?? '';
  const idPaleteValue = form.watch('idPalete') ?? '';

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
      setProdutoConfig(produtoToConfig(produto));
    });
  }, [demandId, sessionSku, skuValue]);

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
        }),
        { caixa: 0, unidade: 0 },
      ),
    [lotesConferidos],
  );

  const canAdvanceStep1 = idPaleteValue.trim().length > 0;
  const canAdvanceStep2 = skuValue.trim().length > 0;

  const nextStep = useCallback(() => {
    if (step === 1) {
      if (!canAdvanceStep1) {
        void form.trigger('idPalete');
        return;
      }
      hapticMedium();
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!canAdvanceStep2) {
        void form.trigger('sku');
        return;
      }
      hapticMedium();
      setStep(3);
    }
  }, [canAdvanceStep1, canAdvanceStep2, form, step]);

  const prevStep = useCallback(() => {
    if (step === 1) return;
    hapticLight();
    setStep((s) => (s > 1 ? ((s - 1) as ConferenciaStep) : s));
  }, [step]);

  const toggleLotesListExpanded = useCallback(() => {
    setLotesListExpanded((prev) => !prev);
  }, []);

  const removeLote = useCallback((id: string) => {
    setLotesConferidos((prev) => prev.filter((lote) => lote.id !== id));
  }, []);

  const openScan = useCallback((target: ScanTarget) => {
    hapticLight();
    setScanTarget(target);
    setScanOpen(true);
  }, []);

  const handleScanResult = useCallback(
    (text: string) => {
      if (!scanTarget) return;
      form.setValue(scanTarget, text, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form, scanTarget],
  );

  const handleScanOpenChange = useCallback((open: boolean) => {
    setScanOpen(open);
    if (!open) {
      setScanTarget(null);
    }
  }, []);

  const scanTitle = scanTarget ? SCAN_TITLES[scanTarget] : '';
  const canSaveConferencia = step === 3;

  const handleSaveConferencia = form.handleSubmit(
    async (values) => {
      hapticMedium();
      setSaveError(null);

      const resolvedSku = values.sku.trim() || sessionSku?.trim() || '';
      if (!resolvedSku) {
        setSaveError('Informe o SKU do produto');
        return;
      }

      const normalizedValues: DetalheItemForm = {
        ...values,
        sku: resolvedSku,
      };

      const context = getConferenciaContextStore(demandId);
      const recebimentoId = context?.recebimentoId ?? demand?.recebimentoId;

      let meta =
        context?.itemMetaBySku[normalizedValues.sku.toLowerCase()] ?? null;

      if (!meta) {
        const produto = await searchProdutoWithCache(
          demandId,
          normalizedValues.sku,
        );
        if (!produto) {
          setSaveError('Produto não encontrado no catálogo');
          return;
        }
        meta = produtoToMeta(produto);
      }

      if (!meta) {
        setSaveError('Produto não identificado para conferência');
        return;
      }

      const validade = normalizedValues.validade
        ? new Date(normalizedValues.validade)
        : undefined;

      const payload = mapConferirPayload(normalizedValues, meta, validade);

      const persistLocal = async () => {
        const entry: LoteConferido = {
          id: createLoteId(),
          lote: normalizedValues.lote ?? '',
          idPalete: normalizedValues.idPalete,
          recebidaCaixa: Number(normalizedValues.recebidaCaixa),
          recebidaUnidade: Number(normalizedValues.recebidaUnidade),
          peso: Number(normalizedValues.peso) || 0,
        };

        setLotesConferidos((prev) => [...prev, entry]);

        const cargoItems = getSkuItemsByDemandId(demandId);
        const fromCargo = cargoItems.find(
          (cargo) => cargo.sku.toLowerCase() === normalizedValues.sku.toLowerCase(),
        );

        saveConferidoItem(demandId, {
          sku: normalizedValues.sku,
          name: fromCargo?.name ?? meta!.descricao,
          form: normalizedValues,
        });

        const latestContext = getConferenciaContextStore(demandId) ?? context;
        if (latestContext) {
          const nextItems = latestContext.itens.map((skuItem) =>
            skuItem.sku.toLowerCase() === normalizedValues.sku.toLowerCase()
              ? { ...skuItem, status: 'conferido' as const }
              : skuItem,
          );
          const nextContext = {
            ...latestContext,
            itens: nextItems,
            conferidoSkus: new Set([
              ...latestContext.conferidoSkus,
              normalizedValues.sku.toLowerCase(),
            ]),
          };
          setConferenciaContextStore(demandId, nextContext);
          await saveConferenciaContextToDb(demandId, nextContext);
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
        await mutate({
          endpoint: `/recebimentos/${recebimentoId}/itens`,
          method: 'POST',
          payload,
          label: `Conferir ${normalizedValues.sku}`,
          optimisticUpdate: persistLocal,
        });
        await navigate({
          to: '/recebimento/$id/itens',
          params: { id: demandId },
        });
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : 'Falha ao conferir item',
        );
      }
    },
    (fieldErrors) => {
      const firstError = Object.values(fieldErrors).find((entry) => entry?.message);
      setSaveError(
        typeof firstError?.message === 'string'
          ? firstError.message
          : 'Preencha os campos obrigatórios',
      );
    },
  );

  return {
    state: {
      demandId,
      step,
      item,
      form,
      lotesConferidos,
      lotesListExpanded,
      errors: form.formState.errors,
      conferidoTotais,
      hasLotesConferidos: lotesConferidos.length > 0,
      canSaveConferencia,
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
    },
    actions: {
      register: form.register,
      openScan,
      handleScanResult,
      handleScanOpenChange,
      toggleLotesListExpanded,
      removeLote,
      handleSaveConferencia,
      nextStep,
      prevStep,
      setValue: form.setValue,
    },
  };
}
