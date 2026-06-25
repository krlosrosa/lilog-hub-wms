'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  buildMockAisles,
  buildMockDriveInLanes,
} from '@/features/layout-cd/mocks/layout-cd.mock';
import { loadPublishedLayout } from '@/features/layout-cd/storage/layout-cd-layout-storage';
import type {
  OccupancyStatus,
  WarehouseAisle,
  WarehouseDriveInLane,
  WarehousePosition,
  WarehouseTransversalBand,
} from '@/features/layout-cd/types/layout-cd.schema';
import { migrateHierarchyCabecas } from '@/features/layout-cd/utils/migrate-hierarchy-cabecas';
import { countStorageComponents } from '@/features/layout-cd/utils/layout-hierarchy-ops';
import { hierarchyToWarehouseLayout } from '@/features/layout-cd/utils/hierarchy-to-warehouse-layout';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildInspectorLevels(position: WarehousePosition) {
  return position.levels.map((lvl) => {
    const occupied = lvl.status !== 'available';
    return {
      level: lvl.level,
      occupied,
      palletId: occupied
        ? `PLT-${1000 + position.posId.length * 10 + lvl.level}`
        : null,
      weightLabel: occupied ? `${900 + lvl.level * 100}kg • SKU-A23` : '--',
    };
  });
}

type WarehouseData = {
  aisles: WarehouseAisle[];
  transversalBands: WarehouseTransversalBand[];
  driveInLanes: WarehouseDriveInLane[];
  fromBuilder: boolean;
  publishedAt?: string;
  itemCount: number;
};

function resolveWarehouseData(): WarehouseData {
  const published = loadPublishedLayout();
  if (published?.hierarchy?.streets?.length) {
    const hierarchy = migrateHierarchyCabecas(published.hierarchy);
    const warehouse = hierarchyToWarehouseLayout(hierarchy);

    return {
      aisles: warehouse.aisles,
      transversalBands: warehouse.transversalBands ?? [],
      driveInLanes: warehouse.driveInLanes,
      fromBuilder: true,
      publishedAt: warehouse.publishedAt,
      itemCount: warehouse.sourceItemCount ?? countStorageComponents(hierarchy),
    };
  }

  return {
    aisles: buildMockAisles(),
    transversalBands: [],
    driveInLanes: buildMockDriveInLanes(),
    fromBuilder: false,
    publishedAt: undefined,
    itemCount: 0,
  };
}

export function useArmazem() {
  const pathname = usePathname();
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] =
    useState<WarehousePosition | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [warehouseData, setWarehouseData] = useState<WarehouseData>(
    resolveWarehouseData,
  );

  useEffect(() => {
    setWarehouseData(resolveWarehouseData());
    setSelectedPosition(null);
    setInspectorOpen(false);
  }, [pathname]);

  const { aisles, transversalBands, driveInLanes, fromBuilder, publishedAt, itemCount } =
    warehouseData;

  const occupancyStats = useMemo(() => {
    const all = [
      ...transversalBands.flatMap((b) => b.positions),
      ...aisles.flatMap((a) => a.sides.flatMap((s) => s.positions)),
      ...driveInLanes.flatMap((l) => l.positions),
    ];
    const counts: Record<OccupancyStatus, number> = {
      available: 0,
      partial: 0,
      occupied: 0,
    };
    for (const pos of all) {
      for (const lvl of pos.levels) {
        counts[lvl.status] += 1;
      }
    }
    return counts;
  }, [aisles, transversalBands, driveInLanes]);

  const selectPosition = useCallback((position: WarehousePosition) => {
    setSelectedPosition(position);
    setInspectorOpen(true);
  }, []);

  const closeInspector = useCallback(() => {
    setInspectorOpen(false);
  }, []);

  const zoomIn = useCallback(() => {
    setZoomPercent((z) => Math.min(z + 10, 200));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomPercent((z) => Math.max(z - 10, 50));
  }, []);

  const modifyAsset = useCallback(async () => {
    if (!selectedPosition) return;
    await delay(500);
    toast.success(`Modificando ${selectedPosition.posId}`);
  }, [selectedPosition]);

  const generateLabel = useCallback(async () => {
    if (!selectedPosition) return;
    await delay(400);
    toast.success(`Etiqueta ZPL gerada para ${selectedPosition.posId}`);
  }, [selectedPosition]);

  const inspectorLevels = useMemo(
    () =>
      selectedPosition ? buildInspectorLevels(selectedPosition) : [],
    [selectedPosition],
  );

  return {
    aisles,
    transversalBands,
    driveInLanes,
    fromBuilder,
    publishedAt,
    itemCount,
    inspectorOpen,
    selectedPosition,
    selectPosition,
    closeInspector,
    zoomPercent,
    zoomIn,
    zoomOut,
    isPanning,
    setIsPanning,
    occupancyStats,
    inspectorLevels,
    modifyAsset,
    generateLabel,
  };
}
