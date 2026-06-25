import type {
  CanvasItem,
  LayoutHierarchy,
  OccupancyStatus,
  PartsLibraryItem,
  ProjectTemplate,
  RackConfigForm,
  RackType,
  WarehouseAisle,
  WarehouseDriveInLane,
  WarehouseLevel,
} from '@/features/layout-cd/types/layout-cd.schema';
import { createDefaultComponent } from '@/features/layout-cd/utils/canvas-to-hierarchy';

export const DEFAULT_ITEM_SIZES: Record<
  RackType,
  { widthPx: number; heightPx: number }
> = {
  'porta-palete': { widthPx: 320, heightPx: 80 },
  'drive-in': { widthPx: 160, heightPx: 80 },
  'flow-rack': { widthPx: 240, heightPx: 80 },
  'pedestrian-path': { widthPx: 200, heightPx: 40 },
  'forklift-street': { widthPx: 200, heightPx: 40 },
  'safety-barrier': { widthPx: 200, heightPx: 20 },
};

const DEFAULT_CONFIG: RackConfigForm = {
  heightPerLevelMm: 2200,
  positionsPerLevel: 3,
  capacityKg: 1200,
  storageLogic: 'fefo',
  rackType: 'porta-palete',
  activeLevel: 3,
};

function createCanvasItem(
  id: string,
  type: RackType,
  label: string,
  x: number,
  y: number,
  overrides?: Partial<Pick<CanvasItem, 'loadLevels' | 'capacityTon' | 'depthMm'>>,
): CanvasItem {
  const size = DEFAULT_ITEM_SIZES[type];
  return {
    id,
    type,
    label,
    x,
    y,
    widthPx: size.widthPx,
    heightPx: size.heightPx,
    loadLevels: overrides?.loadLevels ?? 4,
    capacityTon: overrides?.capacityTon ?? 1.2,
    depthMm: overrides?.depthMm ?? 800,
    config: { ...DEFAULT_CONFIG, rackType: type },
  };
}

export const MOCK_INITIAL_ITEMS: CanvasItem[] = [
  createCanvasItem('item-001', 'drive-in', 'Rack Section #042', 80, 80, {
    loadLevels: 4,
    capacityTon: 1.2,
    depthMm: 800,
  }),
  createCanvasItem('item-002', 'porta-palete', 'Rack Section #018', 80, 200, {
    loadLevels: 3,
    capacityTon: 1.0,
    depthMm: 600,
  }),
];

const strS1 = 'str-001';
const strS2 = 'str-002';
const strDi = 'str-003';

export const MOCK_INITIAL_HIERARCHY: LayoutHierarchy = {
  cabecas: [],
  streets: [
    {
      id: 'street-001',
      code: 'RUA-01',
      name: 'Corredor Armazém A',
      type: 'corredor-armazem',
      order: 1,
      x: 80,
      y: 80,
      structures: [
        {
          id: strS1,
          streetId: 'street-001',
          code: 'EST-S1',
          label: 'Lado 1 — Porta-palete',
          kind: 'lado-estante',
          rackType: 'porta-palete',
          side: 1,
          x: 0,
          y: 0,
          widthPx: 400,
          heightPx: 80,
          components: [
            createDefaultComponent(strS1, 0, 'porta-palete'),
            createDefaultComponent(strS1, 1, 'porta-palete'),
            createDefaultComponent(strS1, 2, 'porta-palete'),
          ],
        },
        {
          id: strS2,
          streetId: 'street-001',
          code: 'EST-S2',
          label: 'Lado 2 — Porta-palete',
          kind: 'lado-estante',
          rackType: 'porta-palete',
          side: 2,
          x: 0,
          y: 120,
          widthPx: 400,
          heightPx: 80,
          components: [
            createDefaultComponent(strS2, 0, 'porta-palete'),
            createDefaultComponent(strS2, 1, 'porta-palete'),
          ],
        },
      ],
    },
    {
      id: 'street-002',
      code: 'RUA-DI',
      name: 'Zona Drive-in',
      type: 'zona-drive-in',
      order: 2,
      x: 560,
      y: 80,
      structures: [
        {
          id: strDi,
          streetId: 'street-002',
          code: 'LANE-01',
          label: 'Bloco Drive-in L1',
          kind: 'bloco-drive-in',
          rackType: 'drive-in',
          x: 0,
          y: 0,
          widthPx: 320,
          heightPx: 80,
          components: [
            createDefaultComponent(strDi, 0, 'drive-in'),
            createDefaultComponent(strDi, 1, 'drive-in'),
            createDefaultComponent(strDi, 2, 'drive-in'),
          ],
        },
      ],
    },
  ],
};

export const MOCK_PARTS_LIBRARY: PartsLibraryItem[] = [
  {
    id: 'porta-palete',
    name: 'Porta-palete',
    subtitle: 'Standard Rack',
    category: 'storage',
    type: 'porta-palete',
  },
  {
    id: 'drive-in',
    name: 'Drive-in',
    subtitle: 'Deep-lane Entry',
    category: 'storage',
    type: 'drive-in',
    highlighted: true,
  },
  {
    id: 'flow-rack',
    name: 'Flow-rack',
    subtitle: 'Dynamic Flow',
    category: 'storage',
    type: 'flow-rack',
  },
  {
    id: 'pedestrian',
    name: 'Pedestrian Path',
    subtitle: '',
    category: 'traffic',
    type: 'pedestrian-path',
  },
  {
    id: 'forklift',
    name: 'Forklift Street',
    subtitle: '',
    category: 'traffic',
    type: 'forklift-street',
  },
  {
    id: 'barrier',
    name: 'Safety Barrier',
    subtitle: '',
    category: 'barriers',
    type: 'safety-barrier',
  },
];

export const MOCK_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'small-dc',
    name: 'Small DC',
    description: 'Até 2.000m²',
    areaLabel: 'Até 2.000m²',
  },
  {
    id: 'distribution',
    name: 'Distribution Center',
    description: 'Layout de Fluxo',
    areaLabel: 'Layout de Fluxo',
  },
  {
    id: 'cold-storage',
    name: 'Cold Storage',
    description: 'Cadeia de Frio',
    areaLabel: 'Cadeia de Frio',
  },
];

function seededStatus(seed: number): OccupancyStatus {
  const mod = seed % 10;
  if (mod >= 7) return 'occupied';
  if (mod >= 4) return 'partial';
  return 'available';
}

function buildLevels(seed: number): WarehouseLevel[] {
  return [4, 3, 2, 1].map((level) => ({
    level,
    status: seededStatus(seed + level),
  }));
}

export function buildMockAisles(): WarehouseAisle[] {
  return Array.from({ length: 4 }, (_, aisleIndex) => {
    const aisleNumber = aisleIndex + 1;
    return {
      aisleNumber,
      sides: [1, 2].map((side) => ({
        side: side as 1 | 2,
        positions: Array.from({ length: 12 }, (_, posIndex) => {
          const pos = posIndex + 1;
          const seed = aisleNumber * 100 + side * 10 + pos;
          return {
            posId: `A0${aisleNumber}-S${side}-P${String(pos).padStart(2, '0')}`,
            aisleId: `A0${aisleNumber}`,
            type: 'standard' as const,
            typeLabel: 'Standard Rack',
            levels: buildLevels(seed),
            maxLoadKg: 4500,
            clearanceMm: 180,
          };
        }),
      })),
    };
  });
}

export function buildMockDriveInLanes(): WarehouseDriveInLane[] {
  return Array.from({ length: 5 }, (_, laneIndex) => {
    const laneNumber = laneIndex + 1;
    return {
      laneNumber,
      positions: Array.from({ length: 12 }, (_, posIndex) => {
        const pos = posIndex + 1;
        const seed = 500 + laneNumber * 20 + pos;
        return {
          posId: `DI-L${laneNumber}-D${String(pos).padStart(2, '0')}`,
          laneId: `L${laneNumber}`,
          type: 'drive-in' as const,
          typeLabel: 'Drive-In Lane',
          levels: buildLevels(seed),
          maxLoadKg: 12000,
          clearanceMm: 150,
        };
      }),
    };
  });
}
