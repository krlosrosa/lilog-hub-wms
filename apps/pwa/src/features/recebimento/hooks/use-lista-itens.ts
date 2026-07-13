import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';
import { isApiConfigured } from '@/lib/offline/api-client';
import { getChecklistDraft } from '@/lib/offline/checklist-cache';
import { db } from '@/lib/offline/db';
import {
  loadDemandProdutos,
  searchProdutoWithCache,
} from '@/lib/offline/produto-cache';

import {
  clearConferenciaNavigation,
  getConferenciaSnapshot,
  setConferenciaNavigation,
} from '../lib/conferencia-conferidos-store';
import { buildFormForLoteEntry } from '../lib/conferencia-form';
import {
  ensureConferenciaContext,
  getConferenciaContextStore,
  saveConferenciaContextToDb,
  setConferenciaContextStore,
} from '../lib/conferencia-context-store';
import {
  setConferenciaEntryStep,
  setConferenciaSkuSession,
} from '../lib/conferencia-sku-session';
import { applyAvariasToSkuItems } from '../lib/apply-avarias-to-sku-items';
import { buildPaletesConferidosResumo } from '../lib/build-paletes-conferidos-resumo';
import { hasPaleteSession } from '../lib/conferencia-palete-session';
import {
  formatConferenteLabel,
  resolveConferenteInfo,
} from '../lib/resolve-conferente-info';
import {
  mapConferenciaContext,
  type MappedConferenciaContext,
} from '../lib/map-conferencia-itens';
import { fetchConferenciaContext } from '../lib/recebimento-api';
import { applyRascunhosToConferenciaContext } from '../lib/apply-rascunhos-to-context';
import type { ProdutoApi } from '../types/recebimento.api';
import {
  previewSkuForConferencia,
  resolveSkuForConferencia,
  type SkuConferenciaPreview,
} from '../lib/resolve-sku-conferencia';
import { useAvariasRegistradas } from './use-avarias-registradas';
import { useDemandById } from './use-demand-by-id';
import type { DetalheItemForm, SkuItem, SkuItemFilter } from '../types/recebimento.schema';

export const SKU_ITEM_FILTERS: readonly {
  id: SkuItemFilter;
  label: string;
}[] = [
  { id: 'avaria', label: 'Com avaria' },
  { id: 'divergencia', label: 'Com divergência' },
] as const;

function matchesFilter(item: SkuItem, filter: SkuItemFilter): boolean {
  switch (filter) {
    case 'conferido':
      return item.status === 'conferido';
    case 'pendente':
      return item.status === 'pendente';
    case 'avaria':
      return item.hasAvaria === true;
    case 'divergencia':
      return item.hasDivergencia === true;
    default:
      return true;
  }
}

export function getSkuItemsByDemandId(demandId?: string): SkuItem[] {
  if (!demandId) return [];
  return getConferenciaContextStore(demandId)?.itens ?? [];
}

export function useListaItens(demandId: string) {
  const navigate = useNavigate();
  const demand = useDemandById(demandId);
  const { avariasRegistradas } = useAvariasRegistradas(demandId);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<SkuItemFilter | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [skuInput, setSkuInput] = useState('');
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [context, setContext] = useState<MappedConferenciaContext | null>(null);
  const [catalog, setCatalog] = useState<ProdutoApi[]>([]);

  const loadContext = useCallback(async () => {
    const cached = await ensureConferenciaContext(demandId);
    if (cached) {
      setContext(cached);
      setIsLoading(false);
    }

    if (!isApiConfigured() || !navigator.onLine) {
      if (!cached) {
        setLoadError('Sem dados em cache para esta demanda.');
      }
      setIsLoading(false);
      return;
    }

    if (!cached) {
      setIsLoading(true);
    }
    setLoadError(null);

    try {
      const apiContext = await fetchConferenciaContext(demandId);
      const mapped = mapConferenciaContext(apiContext);
      const merged = await applyRascunhosToConferenciaContext(mapped, demandId);
      setConferenciaContextStore(demandId, merged);
      await saveConferenciaContextToDb(demandId, merged);
      setContext(merged);

      const cachedDemand = await db.demands.get(demandId);
      const checklistDraft = await getChecklistDraft(demandId);
      const hasRecebimento =
        Boolean(apiContext.recebimentoId) ||
        Boolean(cachedDemand?.recebimentoId) ||
        Boolean(getConferenciaContextStore(demandId)?.recebimentoId);

      const checklistCompletedLocally =
        apiContext.checklistPreenchido ||
        cachedDemand?.preRecebimentoSituacao === 'em_conferencia' ||
        cachedDemand?.preRecebimentoSituacao === 'conferido' ||
        cachedDemand?.pendingOfflineSync === true ||
        Boolean(checklistDraft);

      if (!hasRecebimento && !checklistCompletedLocally) {
        navigate({ to: '/recebimento/$id/checklist', params: { id: demandId } });
      }
    } catch (error) {
      if (!cached) {
        setLoadError(
          error instanceof Error ? error.message : 'Falha ao carregar itens',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [demandId, navigate]);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  useEffect(() => {
    void loadDemandProdutos(demandId).then(setCatalog);
  }, [demandId]);

  const allItems = useMemo(
    () =>
      applyAvariasToSkuItems(
        context?.itens ?? [],
        avariasRegistradas,
        context?.itemMetaBySku,
      ),
    [context?.itens, context?.itemMetaBySku, avariasRegistradas],
  );

  const conferidosItems = useMemo(
    () => allItems.filter((item) => item.status === 'conferido'),
    [allItems],
  );

  const paletesPorSku = useMemo(() => {
    const map: Record<string, ReturnType<typeof buildPaletesConferidosResumo>> = {};

    if (!context?.exigePaleteConferencia) {
      return map;
    }

    for (const item of allItems) {
      const skuKey = item.sku.toLowerCase();
      const meta = context.itemMetaBySku[skuKey];
      if (!meta) {
        continue;
      }

      const paletes = buildPaletesConferidosResumo(
        context.conferidosDetalheByProdutoId[meta.produtoId],
      );

      if (paletes.length > 0) {
        map[skuKey] = paletes;
      }
    }

    return map;
  }, [allItems, context]);

  const skuPreview = useMemo((): SkuConferenciaPreview | null => {
    if (!skuInput.trim() || sheetError) return null;
    return previewSkuForConferencia(skuInput, allItems, catalog);
  }, [skuInput, allItems, sheetError, catalog]);

  const filterCounts = useMemo(
    () =>
      SKU_ITEM_FILTERS.reduce(
        (acc, { id }) => {
          acc[id] = allItems.filter((item) => matchesFilter(item, id)).length;
          return acc;
        },
        {} as Record<SkuItemFilter, number>,
      ),
    [allItems],
  );

  const filteredItems = useMemo(() => {
    let result = allItems;

    if (activeFilter) {
      result = result.filter((item) => matchesFilter(item, activeFilter));
    }

    const term = search.toLowerCase().trim();
    if (term) {
      result = result.filter(
        (item) =>
          item.sku.toLowerCase().includes(term) ||
          item.name.toLowerCase().includes(term),
      );
    }

    return result;
  }, [allItems, search, activeFilter]);

  const progress = useMemo(() => {
    const total = allItems.length;
    const counted = conferidosItems.length;
    const pending = total - counted;
    const percent = total > 0 ? Math.round((counted / total) * 100) : 0;
    return { counted, total, pending, percent };
  }, [allItems.length, conferidosItems.length]);

  const resetSheet = useCallback(() => {
    setSkuInput('');
    setSheetError(null);
    setIsValidating(false);
  }, []);

  const openAddProductSheet = useCallback(() => {
    resetSheet();
    setSheetOpen(true);
  }, [resetSheet]);

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      setSheetOpen(open);
      if (!open) resetSheet();
    },
    [resetSheet],
  );

  const handleSkuInputChange = useCallback((value: string) => {
    setSkuInput(value);
    setSheetError(null);
  }, []);

  const goToConferencia = useCallback(
    (sku: string, entryStep: 1 | 2 | 3 = 1, form?: DetalheItemForm) => {
      setConferenciaSkuSession(demandId, sku);
      if (form) {
        setConferenciaNavigation(demandId, { step: entryStep, form });
      } else {
        clearConferenciaNavigation(demandId);
        setConferenciaEntryStep(demandId, entryStep);
      }
      hapticMedium();
      setSheetOpen(false);
      resetSheet();
      navigate({
        to: '/recebimento/$id/',
        params: { id: demandId },
        search: { init: String(Date.now()) },
      });
    },
    [demandId, navigate, resetSheet],
  );

  const handleValidateProduct = useCallback(async () => {
    setIsValidating(true);
    setSheetError(null);

    const validation = resolveSkuForConferencia(skuInput, allItems, catalog);

    if (validation.ok === false) {
      const produto = await searchProdutoWithCache(demandId, skuInput);
      if (produto) {
        setIsValidating(false);
        goToConferencia(produto.sku);
        return;
      }

      setIsValidating(false);
      setSheetError(validation.error);
      return;
    }

    setIsValidating(false);
    goToConferencia(validation.sku);
  }, [catalog, demandId, goToConferencia, allItems, skuInput]);

  const toggleFilter = useCallback((filter: SkuItemFilter) => {
    setActiveFilter((current) => (current === filter ? null : filter));
  }, []);

  const handleItemClick = useCallback(
    (item: SkuItem) => {
      if (item.status === 'conferido') {
        const snapshot = getConferenciaSnapshot(demandId, item.sku);
        goToConferencia(
          item.sku,
          3,
          snapshot
            ? buildFormForLoteEntry(snapshot.sku, snapshot.idPalete ?? '')
            : undefined,
        );
        return;
      }

      goToConferencia(item.sku, hasPaleteSession(demandId) ? 2 : 1);
    },
    [demandId, goToConferencia],
  );

  const canFinalize = progress.total > 0 && progress.counted > 0;

  const conferenteLabel = useMemo(
    () => formatConferenteLabel(resolveConferenteInfo(demandId, demand)),
    [demand, demandId, context?.conferente, context?.conferenteMatricula],
  );

  const handleFinalize = useCallback(async () => {
    if (!canFinalize || isFinalizing) return;

    setIsFinalizing(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setIsFinalizing(false);
    navigate({ to: '/recebimento/$id/termino', params: { id: demandId } });
  }, [canFinalize, demandId, isFinalizing, navigate]);

  return {
    state: {
      demandId,
      demand,
      search,
      activeFilter,
      filterCounts,
      items: filteredItems,
      progress,
      isEmpty: !isLoading && filteredItems.length === 0,
      isLoading,
      loadError,
      cargaId: demand?.id ?? demandId,
      dock: demand?.dock ?? context?.dock ?? '—',
      conferenteLabel,
      sheetOpen,
      skuInput,
      skuPreview,
      sheetError,
      isValidating,
      canFinalize,
      isFinalizing,
      recebimentoId: context?.recebimentoId ?? demand?.recebimentoId ?? null,
      paletesPorSku,
      exigePaleteConferencia: context?.exigePaleteConferencia ?? false,
    },
    actions: {
      setSearch,
      toggleFilter,
      handleItemClick,
      openAddProductSheet,
      handleSheetOpenChange,
      handleSkuInputChange,
      handleValidateProduct,
      handleFinalize,
      reload: loadContext,
    },
  };
}
