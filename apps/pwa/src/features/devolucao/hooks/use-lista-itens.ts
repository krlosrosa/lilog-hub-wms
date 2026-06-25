import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { setConferenciaSkuSession } from '../lib/conferencia-sku-session';
import {
  previewSkuForConferencia,
  resolveSkuForConferencia,
  type SkuConferenciaPreview,
} from '../lib/resolve-sku-conferencia';
import { useDemandById } from './use-demand-by-id';
import type { SkuItem, SkuItemFilter } from '../types/devolucao.schema';

const DEFAULT_SKU_ITEMS: SkuItem[] = [
  {
    sku: 'SKU-99012',
    name: 'Válvula Hidráulica Tipo-B Industri',
    status: 'pendente',
    hasDivergencia: true,
  },
  {
    sku: 'SKU-88231',
    name: 'Sensor de Proximidade Infravermelho',
    status: 'pendente',
    isReentrega: true,
    quantidadeEsperada: 120,
  },
  {
    sku: 'SKU-10293',
    name: 'Conector Elétrico Trifásico 40A',
    status: 'pendente',
    hasAvaria: true,
    isReentrega: true,
    quantidadeEsperada: 48,
  },
  {
    sku: 'SKU-77210',
    name: 'Fusível de Cerâmica 10A 250V',
    status: 'conferido',
    hasAvaria: true,
  },
  {
    sku: 'SKU-44501',
    name: 'Rolamento Esférico de Precisão',
    status: 'conferido',
    hasDivergencia: true,
  },
];

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

export function getSkuItemsByDemandId(): SkuItem[] {
  return DEFAULT_SKU_ITEMS;
}

export function useListaItens(demandId: string) {
  const navigate = useNavigate();
  const demand = useDemandById(demandId);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<SkuItemFilter | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [skuInput, setSkuInput] = useState('');
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const items = useMemo(() => getSkuItemsByDemandId(), []);

  const skuPreview = useMemo((): SkuConferenciaPreview | null => {
    if (!skuInput.trim() || sheetError) return null;
    return previewSkuForConferencia(skuInput, items);
  }, [skuInput, items, sheetError]);

  const filterCounts = useMemo(
    () =>
      SKU_ITEM_FILTERS.reduce(
        (acc, { id }) => {
          acc[id] = items.filter((item) => matchesFilter(item, id)).length;
          return acc;
        },
        {} as Record<SkuItemFilter, number>
      ),
    [items]
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
          item.name.toLowerCase().includes(term)
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
    [resetSheet]
  );

  const handleSkuInputChange = useCallback((value: string) => {
    setSkuInput(value);
    setSheetError(null);
  }, []);

  const goToConferencia = useCallback(
    (sku: string) => {
      setConferenciaSkuSession(demandId, sku);
      hapticMedium();
      setSheetOpen(false);
      resetSheet();
      navigate({ to: '/devolucao/$id/', params: { id: demandId } });
    },
    [demandId, navigate, resetSheet]
  );

  const handleValidateProduct = useCallback(async () => {
    setIsValidating(true);
    setSheetError(null);

    await new Promise((resolve) => setTimeout(resolve, 400));

    const validation = resolveSkuForConferencia(skuInput, items);
    setIsValidating(false);

    if (validation.ok === false) {
      setSheetError(validation.error);
      return;
    }

    goToConferencia(validation.sku);
  }, [goToConferencia, items, skuInput]);

  const toggleFilter = useCallback((filter: SkuItemFilter) => {
    setActiveFilter((current) => (current === filter ? null : filter));
  }, []);

  const handleItemClick = useCallback(
    (item: SkuItem) => {
      if (item.status === 'conferido') return;
      goToConferencia(item.sku);
    },
    [goToConferencia]
  );

  const canFinalize = progress.total > 0;

  const handleFinalize = useCallback(async () => {
    if (!canFinalize || isFinalizing) return;

    setIsFinalizing(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsFinalizing(false);
    navigate({ to: '/devolucao/$id/termino', params: { id: demandId } });
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
      isEmpty: filteredItems.length === 0,
      cargaId: demand?.id ?? `#SHP-${demandId}`,
      dock: demand?.dock ?? '—',
      paletesEsperados: demand?.paletesEsperados ?? 0,
      paletesRecebidos: demand?.paletesRecebidos,
      sheetOpen,
      skuInput,
      skuPreview,
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
