import { BUILDER_GRID_PX } from '@/features/layout-cd/types/layout-cd.schema';
import type {
  CanvasItem,
  OccupancyStatus,
  RackType,
  WarehouseAisle,
  WarehouseDriveInLane,
  WarehouseLayout,
  WarehouseLevel,
  WarehousePosition,
} from '@/features/layout-cd/types/layout-cd.schema';

const STANDARD_TYPES: RackType[] = ['porta-palete', 'flow-rack'];
const POSITIONS_PER_LANE = 12;
const MAX_LEVELS_DISPLAY = 4;

function buildLevels(loadLevels: number): WarehouseLevel[] {
  const activeLevels = Math.min(loadLevels, MAX_LEVELS_DISPLAY);
  return [4, 3, 2, 1].map((level) => ({
    level,
    status: (level <= activeLevels ? 'available' : 'available') as OccupancyStatus,
  }));
}

function itemToPosition(
  item: CanvasItem,
  posId: string,
  warehouseType: 'standard' | 'drive-in',
): WarehousePosition {
  const typeLabel =
    warehouseType === 'drive-in'
      ? 'Drive-In Lane'
      : item.type === 'flow-rack'
        ? 'Flow Rack'
        : 'Standard Rack';

  return {
    posId,
    aisleId: warehouseType === 'standard' ? posId.split('-')[0] : undefined,
    laneId: warehouseType === 'drive-in' ? posId.split('-')[0] : undefined,
    type: warehouseType,
    typeLabel,
    levels: buildLevels(item.loadLevels),
    maxLoadKg: item.config.capacityKg,
    clearanceMm: item.depthMm,
  };
}

function positionsPerItem(item: CanvasItem): number {
  return Math.max(1, Math.round(item.widthPx / BUILDER_GRID_PX));
}

function groupByRow(items: CanvasItem[]): CanvasItem[][] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: CanvasItem[][] = [];

  for (const item of sorted) {
    const rowY = snapRow(item.y);
    const existing = rows.find((row) => {
      const first = row[0];
      return first !== undefined && snapRow(first.y) === rowY;
    });
    if (existing) {
      existing.push(item);
    } else {
      rows.push([item]);
    }
  }

  return rows.map((row) => row.sort((a, b) => a.x - b.x));
}

function snapRow(y: number): number {
  return Math.round(y / BUILDER_GRID_PX) * BUILDER_GRID_PX;
}

function buildAislesFromItems(items: CanvasItem[]): WarehouseAisle[] {
  const standardItems = items.filter((i) => STANDARD_TYPES.includes(i.type));
  if (standardItems.length === 0) return [];

  const rows = groupByRow(standardItems);

  return rows.map((rowItems, aisleIndex) => {
    const aisleNumber = aisleIndex + 1;
    const aislePrefix = `A${String(aisleNumber).padStart(2, '0')}`;

    const side1Positions: WarehousePosition[] = [];
    let posIndex = 1;

    for (const item of rowItems) {
      const slots = positionsPerItem(item);
      for (let s = 0; s < slots; s += 1) {
        if (posIndex > POSITIONS_PER_LANE) break;
        const posId = `${aislePrefix}-S1-P${String(posIndex).padStart(2, '0')}`;
        side1Positions.push(itemToPosition(item, posId, 'standard'));
        posIndex += 1;
      }
    }

    const side2Positions: WarehousePosition[] = Array.from(
      { length: Math.max(0, POSITIONS_PER_LANE - side1Positions.length) },
      (_, i) => {
        const pos = side1Positions.length + i + 1;
        const posId = `${aislePrefix}-S2-P${String(pos).padStart(2, '0')}`;
        return {
          posId,
          aisleId: aislePrefix,
          type: 'standard' as const,
          typeLabel: 'Standard Rack',
          levels: buildLevels(4),
          maxLoadKg: 4500,
          clearanceMm: 180,
        };
      },
    );

    return {
      aisleNumber,
      sides: [
        { side: 1 as const, positions: side1Positions },
        { side: 2 as const, positions: side2Positions },
      ],
    };
  });
}

function buildDriveInLanesFromItems(items: CanvasItem[]): WarehouseDriveInLane[] {
  const driveItems = items
    .filter((i) => i.type === 'drive-in')
    .sort((a, b) => a.x - b.x || a.y - b.y);

  if (driveItems.length === 0) return [];

  const lanes: WarehouseDriveInLane[] = [];
  let laneNumber = 1;
  let currentLanePositions: WarehousePosition[] = [];

  for (const item of driveItems) {
    const slots = positionsPerItem(item);
    for (let s = 0; s < slots; s += 1) {
      if (currentLanePositions.length >= POSITIONS_PER_LANE) {
        lanes.push({ laneNumber, positions: currentLanePositions });
        laneNumber += 1;
        currentLanePositions = [];
      }
      const posId = `DI-L${laneNumber}-D${String(currentLanePositions.length + 1).padStart(2, '0')}`;
      currentLanePositions.push(itemToPosition(item, posId, 'drive-in'));
    }
  }

  if (currentLanePositions.length > 0) {
    lanes.push({ laneNumber, positions: currentLanePositions });
  }

  return lanes;
}

export function canvasItemsToWarehouseLayout(
  items: CanvasItem[],
): WarehouseLayout {
  return {
    aisles: buildAislesFromItems(items),
    driveInLanes: buildDriveInLanesFromItems(items),
    sourceItemCount: items.length,
    publishedAt: new Date().toISOString(),
  };
}
