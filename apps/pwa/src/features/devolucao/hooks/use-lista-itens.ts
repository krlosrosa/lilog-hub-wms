import { useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { searchProduto } from '../lib/devolucao-api';
import { setConferenciaSkuSession } from '../lib/conferencia-sku-session';
import { isChecklistDevolucaoPendente } from '../lib/devolucao-api-mapper';
import { getSkuItemsByDemandId } from '../lib/devolucao-sku-items';
import {
  previewSkuForConferencia,
  resolveSkuForConferencia,
  type SkuConferenciaPreview,
} from '../lib/resolve-sku-conferencia';
import { useDemandaDetalhe, useDemandById } from './use-demand-by-id';
import type { SkuItem, SkuItemFilter } from '../types/devolucao.schema';

export const SKU_ITEM_FILTERS: readonly {
  id: SkuItemFilter;
  label: string;
}[] = [
  { id: 'conferido', label: 'Conferidos' },
  { id: 'pendente', label: 'Não conferidos' },
  { id: 'avaria', label: 'Com avaria' },
  { id: 'divergencia', label: 'Com divergência' },
  { id: 'reentrega', label: 'Reentrega' },
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
    case 'reentrega':
      return item.isReentrega === true;
    default:
      return true;
  }
}

export function useListaItens(demandId: string) {
  const navigate = useNavigate();
  const demand = useDemandById(demandId);
  const detalhe = useDemandaDetalhe(demandId);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<SkuItemFilter | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [skuInput, setSkuInput] = useState('');
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [catalogPreviewDescricao, setCatalogPreviewDescricao] = useState<string | null>(
    null,
  );

  const items =
    useLiveQuery(
      () => getSkuItemsByDemandId(demandId),
      [demandId, detalhe?.cachedAt],
    ) ?? [];

  const checklistPendente = isChecklistDevolucaoPendente({
    apiStatus: detalhe?.status,
    demandStatus: demand?.status,
  });

  useEffect(() => {
    if (demand === undefined && detalhe === undefined) {
      return;
    }

    if (checklistPendente && (demand != null || detalhe != null)) {
      navigate({ to: '/devolucao/$id/checklist', params: { id: demandId }, replace: true });
    }
  }, [checklistPendente, demand, detalhe, demandId, navigate]);

  const skuPreview = useMemo((): SkuConferenciaPreview | null => {
    if (!skuInput.trim() || sheetError) return null;
    return previewSkuForConferencia(skuInput, items);
  }, [skuInput, items, sheetError]);

  useEffect(() => {
    if (!sheetOpen) {
      setCatalogPreviewDescricao(null);
      return;
    }

    const preview = previewSkuForConferencia(skuInput, items);
    if (!preview || preview.source !== 'novo' || skuInput.trim().length < 3) {
      setCatalogPreviewDescricao(null);
      return;
    }

    const term = skuInput.trim();
    const timer = window.setTimeout(() => {
      void searchProduto(term).then((produto) => {
        if (produto && term.toLowerCase() === skuInput.trim().toLowerCase()) {
          setCatalogPreviewDescricao(produto.descricao);
        }
      });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [sheetOpen, skuInput, items]);

  const filterCounts = useMemo(
    () =>
      SKU_ITEM_FILTERS.reduce(
        (acc, { id }) => {
          acc[id] = items.filter((item) => matchesFilter(item, id)).length;
          return acc;
        },
        {} as Record<SkuItemFilter, number>,
      ),
    [items],
  );

  const filteredItems = useMemo(() => {
    let result = items;

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
  }, [items, search, activeFilter]);

  const progress = useMemo(() => {
    const total = items.length;
    const counted = items.filter((item) => item.status === 'conferido').length;
    const pending = total - counted;
    const percent = total > 0 ? Math.round((counted / total) * 100) : 0;
    return { counted, total, pending, percent };
  }, [items]);

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
    (sku: string, itemId?: string, descricao?: string) => {
      setConferenciaSkuSession(demandId, sku, itemId, descricao);
      hapticMedium();
      setSheetOpen(false);
      resetSheet();
      navigate({ to: '/devolucao/$id/', params: { id: demandId } });
    },
    [demandId, navigate, resetSheet],
  );

  const handleValidateProduct = useCallback(async () => {
    setIsValidating(true);
    setSheetError(null);

    const validation = resolveSkuForConferencia(skuInput, items);

    if (validation.ok === false) {
      setIsValidating(false);
      setSheetError(validation.error);
      return;
    }

    if (validation.preview.source === 'novo') {
      const produto = await searchProduto(skuInput);
      setIsValidating(false);
      if (!produto) {
        setSheetError('SKU não encontrado no catálogo de produtos');
        return;
      }
      goToConferencia(produto.sku, undefined, produto.descricao);
      return;
    }

    setIsValidating(false);
    const matched = items.find(
      (item) => item.sku.toLowerCase() === validation.sku.toLowerCase(),
    );
    goToConferencia(validation.sku, matched?.itemId);
  }, [goToConferencia, items, skuInput]);

  const toggleFilter = useCallback((filter: SkuItemFilter) => {
    setActiveFilter((current) => (current === filter ? null : filter));
  }, []);

  const handleItemClick = useCallback(
    (item: SkuItem) => {
      goToConferencia(item.sku, item.itemId);
    },
    [goToConferencia],
  );

  const canFinalize = progress.total > 0;

  const handleFinalize = useCallback(async () => {
    if (!canFinalize || isFinalizing) return;

    setIsFinalizing(true);
    setIsFinalizing(false);
    navigate({ to: '/devolucao/$id/termino', params: { id: demandId } });
  }, [canFinalize, demandId, isFinalizing, navigate]);

  return {
    state: {
      demandId,
      demand,
      detalhe,
      search,
      activeFilter,
      filterCounts,
      items: filteredItems,
      progress,
      isEmpty: filteredItems.length === 0,
      isLoadingItems: detalhe === undefined && items.length === 0,
      cargaId: demand?.id ?? detalhe?.codigoDemanda ?? demandId,
      dock: demand?.dock ?? '—',
      paletesEsperados: demand?.paletesEsperados ?? 0,
      paletesRecebidos: demand?.paletesRecebidos,
      sheetOpen,
      skuInput,
      skuPreview,
      catalogPreviewDescricao,
      sheetError,
      isValidating,
      canFinalize,
      isFinalizing,
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
    },
  };
}
