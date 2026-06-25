'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  MOCK_PICKING_KPIS,
  MOCK_REPLENISHMENT_ITEMS,
  MOCK_REPLENISHMENT_TOTAL,
} from '@/features/op-wms/mocks/op-wms.mock';
import {
  DEFAULT_GESTAO_PICKING_FILTERS,
  GESTAO_PICKING_PAGE_SIZE,
  type ReplenishmentItem,
} from '@/features/op-wms/types/op-wms.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function matchesSearch(item: ReplenishmentItem, search: string) {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return (
    item.address.toLowerCase().includes(term) ||
    item.sku.toLowerCase().includes(term) ||
    item.productName.toLowerCase().includes(term)
  );
}

export function useGestaoPicking() {
  const [search, setSearch] = useState(DEFAULT_GESTAO_PICKING_FILTERS.search);
  const [onlyCritical, setOnlyCritical] = useState(
    DEFAULT_GESTAO_PICKING_FILTERS.onlyCritical,
  );
  const [page, setPage] = useState(DEFAULT_GESTAO_PICKING_FILTERS.page);
  const [items, setItems] = useState(MOCK_REPLENISHMENT_ITEMS);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [isLoading] = useState(false);

  const kpis = MOCK_PICKING_KPIS;
  const totalRecords = MOCK_REPLENISHMENT_TOTAL;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (onlyCritical && item.status !== 'critical') return false;
      return matchesSearch(item, search);
    });
  }, [items, onlyCritical, search]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * GESTAO_PICKING_PAGE_SIZE;
    return filteredItems.slice(start, start + GESTAO_PICKING_PAGE_SIZE);
  }, [filteredItems, page]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / GESTAO_PICKING_PAGE_SIZE),
  );

  const generateMission = useCallback(async (itemId: string) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item || !item.canGenerateMission) return;

    setGeneratingIds((prev) => new Set(prev).add(itemId));
    await delay(1200);

    setItems((prev) =>
      prev.map((entry) =>
        entry.id === itemId
          ? {
              ...entry,
              status: 'in_mission' as const,
              canGenerateMission: false,
              missionId: String(Math.floor(Math.random() * 90000) + 10000),
              suggestedLabel: `Enviado (${entry.suggested})`,
            }
          : entry,
      ),
    );

    setGeneratingIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });

    toast.success(`Missão gerada para ${item.address}`);
  }, [items]);

  const viewPulmao = useCallback((itemId: string) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;
    toast.info(`Visualizando pulmão para ${item.sku} em ${item.address}`);
  }, [items]);

  const exportData = useCallback(() => {
    toast.success('Exportação iniciada — arquivo será baixado em breve.');
  }, []);

  const openAdvancedFilters = useCallback(() => {
    toast.info('Filtros avançados em breve.');
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleOnlyCriticalChange = useCallback((value: boolean) => {
    setOnlyCritical(value);
    setPage(1);
  }, []);

  return {
    isLoading,
    kpis,
    items: paginatedItems,
    filteredCount: filteredItems.length,
    totalRecords,
    search,
    onlyCritical,
    page,
    totalPages,
    generatingIds,
    setSearch: handleSearchChange,
    setOnlyCritical: handleOnlyCriticalChange,
    setPage,
    generateMission,
    viewPulmao,
    exportData,
    openAdvancedFilters,
  };
}
