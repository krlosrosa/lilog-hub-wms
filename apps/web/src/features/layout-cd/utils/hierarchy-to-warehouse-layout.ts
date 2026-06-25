import type {
  LayoutCabeca,
  LayoutComponent,
  LayoutHierarchy,
  LayoutStreet,
  LayoutStructure,
  OccupancyStatus,
  WarehouseAisle,
  WarehouseDriveInLane,
  WarehouseLayout,
  WarehouseLevel,
  WarehousePosition,
  WarehouseTransversalBand,
} from '@/features/layout-cd/types/layout-cd.schema';

const AISLE_STRUCTURE_KINDS = ['lado-estante', 'flow-rack-bloco'] as const;

function isDriveInStructure(structure: LayoutStructure): boolean {
  return (
    structure.kind === 'bloco-drive-in' ||
    structure.rackType === 'drive-in'
  );
}

function isAisleStructure(structure: LayoutStructure): boolean {
  return (AISLE_STRUCTURE_KINDS as readonly string[]).includes(structure.kind);
}

function isLateralStructure(structure: LayoutStructure): boolean {
  return isAisleStructure(structure) && !structure.cabecaId;
}

function resolveLoadLevels(component: LayoutComponent): number {
  const fromProps = Math.round(Number(component.loadLevels));
  const fromConfig = Math.round(Number(component.config?.activeLevel));
  const value = Number.isFinite(fromProps) && fromProps > 0 ? fromProps : fromConfig;
  return Math.min(12, Math.max(1, value || 1));
}

function buildLevels(loadLevels: number): WarehouseLevel[] {
  const count = Math.min(12, Math.max(1, Math.floor(loadLevels)));
  return Array.from({ length: count }, (_, i) => ({
    level: count - i,
    status: 'available' as OccupancyStatus,
  }));
}

function sanitizeSlotCode(code: string, fallbackIndex: number): string {
  const trimmed = code.trim().toUpperCase();
  if (trimmed.length > 0) return trimmed;
  return `P${String(fallbackIndex).padStart(2, '0')}`;
}

function storageComponents(structure: LayoutStructure): LayoutComponent[] {
  return structure.components.filter((c) => c.kind === 'posicao-armazenagem');
}

type PositionSource = {
  streetId?: string;
  cabecaId?: string;
  structureId: string;
  componentId: string;
};

function buildTransversalPosition(
  cabeca: LayoutCabeca,
  aisleNumber: number,
  aislePrefix: string,
  positionIndex: number,
  structure: LayoutStructure,
  component: LayoutComponent,
): WarehousePosition {
  const endCode = cabeca.end === 'inicio' ? 'CI' : 'CF';
  const displayCode = sanitizeSlotCode(component.code, positionIndex);
  const posId = `${cabeca.code}-${endCode}-${aislePrefix}-${displayCode}`;
  const loadLevels = resolveLoadLevels(component);
  const typeLabel =
    structure.rackType === 'flow-rack' ? 'Flow Rack' : 'Standard Rack';

  return {
    posId,
    displayCode,
    label: component.label.trim(),
    aisleId: aislePrefix,
    type: 'standard',
    typeLabel: `${typeLabel} · Transversal`,
    levels: buildLevels(loadLevels),
    maxLoadKg: component.config.capacityKg,
    clearanceMm: component.depthMm,
    sourceStreetId: structure.anchorStreetId,
    sourceCabecaId: cabeca.id,
    sourceStructureId: structure.id,
    sourceComponentId: component.id,
  };
}

function buildStandardPosition(
  aisleNumber: number,
  side: 1 | 2,
  positionIndex: number,
  structure: LayoutStructure,
  component: LayoutComponent,
  source: PositionSource,
): WarehousePosition {
  const aislePrefix = `A${String(aisleNumber).padStart(2, '0')}`;
  const displayCode = sanitizeSlotCode(component.code, positionIndex);
  const posId = `${aislePrefix}-S${side}-${displayCode}`;
  const loadLevels = resolveLoadLevels(component);

  const typeLabel =
    structure.rackType === 'flow-rack' ? 'Flow Rack' : 'Standard Rack';

  return {
    posId,
    displayCode,
    label: component.label.trim(),
    aisleId: aislePrefix,
    type: 'standard',
    typeLabel,
    levels: buildLevels(loadLevels),
    maxLoadKg: component.config.capacityKg,
    clearanceMm: component.depthMm,
    sourceStreetId: source.streetId,
    sourceStructureId: source.structureId,
    sourceComponentId: source.componentId,
  };
}

function buildDriveInPosition(
  laneNumber: number,
  positionIndex: number,
  structure: LayoutStructure,
  component: LayoutComponent,
  source: PositionSource,
): WarehousePosition {
  const displayCode = sanitizeSlotCode(component.code, positionIndex);
  const posId = `DI-L${laneNumber}-${displayCode}`;
  const loadLevels = resolveLoadLevels(component);

  return {
    posId,
    displayCode,
    label: component.label.trim(),
    laneId: `L${laneNumber}`,
    type: 'drive-in',
    typeLabel: 'Drive-In Lane',
    levels: buildLevels(loadLevels),
    maxLoadKg: component.config.capacityKg,
    clearanceMm: component.depthMm,
    sourceStreetId: source.streetId,
    sourceStructureId: source.structureId,
    sourceComponentId: source.componentId,
  };
}

function buildAisleFromStreet(
  street: LayoutStreet,
  aisleNumber: number,
): WarehouseAisle | null {
  if (street.type !== 'corredor-armazem') return null;

  const shelfStructures = street.structures.filter(isAisleStructure);
  if (shelfStructures.length === 0) return null;

  const lateralStructures = shelfStructures.filter(isLateralStructure);

  const sides = ([1, 2] as const)
    .map((sideNum) => {
      const sideStructures = lateralStructures.filter(
        (s) => (s.side ?? 1) === sideNum,
      );
      const positions: WarehousePosition[] = [];
      let posIndex = 1;

      for (const structure of sideStructures) {
        for (const component of storageComponents(structure)) {
          positions.push(
            buildStandardPosition(
              aisleNumber,
              sideNum,
              posIndex,
              structure,
              component,
              {
                streetId: street.id,
                structureId: structure.id,
                componentId: component.id,
              },
            ),
          );
          posIndex += 1;
        }
      }

      return { side: sideNum, positions };
    })
    .filter((side) => side.positions.length > 0);

  const activeSides = sides.filter((side) => side.positions.length > 0);
  if (activeSides.length === 0) return null;

  return {
    aisleNumber,
    aisleCode: street.code,
    aisleName: street.name,
    sides: activeSides,
  };
}

function buildStreetAisleNumberMap(
  hierarchy: LayoutHierarchy,
): Map<string, number> {
  const map = new Map<string, number>();
  let aisleNumber = 0;
  const sorted = [...hierarchy.streets].sort((a, b) => a.order - b.order);
  for (const street of sorted) {
    if (street.type === 'corredor-armazem') {
      aisleNumber += 1;
      map.set(street.id, aisleNumber);
    }
  }
  return map;
}

function buildTransversalBands(
  hierarchy: LayoutHierarchy,
  aisleByStreetId: Map<string, number>,
): WarehouseTransversalBand[] {
  const streetCodeById = new Map(
    hierarchy.streets.map((s) => [s.id, s.code] as const),
  );

  return hierarchy.cabecas
    .sort((a, b) => a.order - b.order)
    .map((cabeca) => {
      const aisleNumbers = cabeca.streetIds
        .map((id) => aisleByStreetId.get(id))
        .filter((n): n is number => n !== undefined)
        .sort((a, b) => a - b);

      const positions: WarehousePosition[] = [];
      let posIndex = 1;

      for (const structure of cabeca.structures) {
        const anchorId = structure.anchorStreetId ?? cabeca.streetIds[0];
        const aisleNumber = aisleByStreetId.get(anchorId ?? '');
        if (!aisleNumber) continue;
        const aislePrefix = `A${String(aisleNumber).padStart(2, '0')}`;

        for (const component of storageComponents(structure)) {
          positions.push(
            buildTransversalPosition(
              cabeca,
              aisleNumber,
              aislePrefix,
              posIndex,
              structure,
              component,
            ),
          );
          posIndex += 1;
        }
      }

      return {
        bandId: cabeca.id,
        bandCode: cabeca.code,
        bandName: cabeca.name,
        end: cabeca.end,
        aisleNumbers,
        streetCodes: cabeca.streetIds
          .map((id) => streetCodeById.get(id) ?? id)
          .filter(Boolean),
        positions,
      };
    })
    .filter((band) => band.positions.length > 0 || band.aisleNumbers.length > 0);
}

function buildDriveInLanesFromHierarchy(
  hierarchy: LayoutHierarchy,
): WarehouseDriveInLane[] {
  const sortedStreets = [...hierarchy.streets].sort((a, b) => a.order - b.order);
  const lanes: WarehouseDriveInLane[] = [];
  let laneNumber = 1;

  for (const street of sortedStreets) {
    const driveStructures = street.structures.filter(isDriveInStructure);
    for (const structure of driveStructures) {
      const components = storageComponents(structure);
      const source = {
        streetId: street.id,
        structureId: structure.id,
        componentId: '',
      };
    const positions =
        components.length > 0
          ? components.map((component, index) =>
              buildDriveInPosition(laneNumber, index + 1, structure, component, {
                ...source,
                componentId: component.id,
              }),
            )
          : [
              buildDriveInPosition(
                laneNumber,
                1,
                structure,
                createPlaceholderComponent(structure),
                { ...source, componentId: structure.id },
              ),
            ];

      lanes.push({
        laneNumber,
        laneCode: `${street.code}-${structure.code}`,
        laneName: `${street.name} · ${structure.label}`,
        positions,
      });
      laneNumber += 1;
    }
  }

  return lanes;
}

function createPlaceholderComponent(structure: LayoutStructure): LayoutComponent {
  return {
    id: `${structure.id}-placeholder`,
    code: 'P01',
    label: '',
    kind: 'posicao-armazenagem',
    loadLevels: 4,
    capacityTon: 1.2,
    depthMm: 800,
    config: {
      heightPerLevelMm: 2200,
      positionsPerLevel: 3,
      capacityKg: 1200,
      storageLogic: 'fefo',
      rackType: 'drive-in',
      activeLevel: 4,
    },
  };
}

export function hierarchyToWarehouseLayout(
  hierarchy: LayoutHierarchy,
): WarehouseLayout {
  const sortedStreets = [...hierarchy.streets].sort((a, b) => a.order - b.order);

  const aisles: WarehouseAisle[] = [];
  let aisleNumber = 0;

  for (const street of sortedStreets) {
    if (street.type === 'corredor-armazem') {
      aisleNumber += 1;
      const aisle = buildAisleFromStreet(street, aisleNumber);
      if (aisle) aisles.push(aisle);
    }
  }

  const driveInLanes = buildDriveInLanesFromHierarchy(hierarchy);
  const aisleByStreetId = buildStreetAisleNumberMap(hierarchy);
  const transversalBands = buildTransversalBands(hierarchy, aisleByStreetId);

  const componentCount = sortedStreets.reduce(
    (acc, s) =>
      acc +
      s.structures.reduce(
        (a, st) =>
          a + st.components.filter((c) => c.kind === 'posicao-armazenagem').length,
        0,
      ),
    0,
  ) + hierarchy.cabecas.reduce(
    (acc, cabeca) =>
      acc +
      cabeca.structures.reduce(
        (a, st) =>
          a +
          st.components.filter((c) => c.kind === 'posicao-armazenagem').length,
        0,
      ),
    0,
  );

  return {
    aisles,
    ...(transversalBands.length > 0 ? { transversalBands } : {}),
    driveInLanes,
    sourceItemCount: componentCount,
    publishedAt: new Date().toISOString(),
  };
}
