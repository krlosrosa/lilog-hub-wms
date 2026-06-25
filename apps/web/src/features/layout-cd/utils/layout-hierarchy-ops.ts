import type {
  LayoutCabeca,
  LayoutComponent,
  LayoutHierarchy,
  LayoutSelection,
  LayoutStreet,
  LayoutStructure,
  RackType,
  StreetType,
  StructureKind,
} from '@/features/layout-cd/types/layout-cd.schema';
import { removeCabecaNodeFromHierarchy } from '@/features/layout-cd/utils/layout-cabeca-ops';

import {
  createDefaultComponent,
  defaultStructureSize,
} from '@/features/layout-cd/utils/canvas-to-hierarchy';

let streetCounter = 10;
let structureCounter = 10;
let componentCounter = 10;

export function nextStreetId(): string {
  streetCounter += 1;
  return `street-${String(streetCounter).padStart(3, '0')}`;
}

export function nextStructureId(): string {
  structureCounter += 1;
  return `str-${String(structureCounter).padStart(3, '0')}`;
}

export function nextComponentId(structureId: string): string {
  componentCounter += 1;
  return `${structureId}-cmp-${String(componentCounter).padStart(3, '0')}`;
}

export function findStreet(
  hierarchy: LayoutHierarchy,
  streetId: string,
): LayoutStreet | undefined {
  return hierarchy.streets.find((s) => s.id === streetId);
}

export function findStructure(
  street: LayoutStreet,
  structureId: string,
): LayoutStructure | undefined {
  return street.structures.find((s) => s.id === structureId);
}

export function findComponent(
  structure: LayoutStructure,
  componentId: string,
): LayoutComponent | undefined {
  return structure.components.find((c) => c.id === componentId);
}

export function resolveSelection(
  hierarchy: LayoutHierarchy,
  selection: LayoutSelection | null,
): {
  street: LayoutStreet | null;
  cabeca: LayoutCabeca | null;
  structure: LayoutStructure | null;
  component: LayoutComponent | null;
} {
  if (!selection) {
    return { street: null, cabeca: null, structure: null, component: null };
  }

  if (selection.cabecaId) {
    const cabeca =
      hierarchy.cabecas.find((c) => c.id === selection.cabecaId) ?? null;
    if (!cabeca) {
      return { street: null, cabeca: null, structure: null, component: null };
    }
    if (selection.level === 'cabeca' || !selection.structureId) {
      return { street: null, cabeca, structure: null, component: null };
    }
    const structure =
      cabeca.structures.find((s) => s.id === selection.structureId) ?? null;
    if (!structure) {
      return { street: null, cabeca, structure: null, component: null };
    }
    if (selection.level === 'structure' || !selection.componentId) {
      return { street: null, cabeca, structure, component: null };
    }
    const component =
      structure.components.find((c) => c.id === selection.componentId) ?? null;
    return { street: null, cabeca, structure, component };
  }

  const street = selection.streetId
    ? (findStreet(hierarchy, selection.streetId) ?? null)
    : null;
  if (!street) return { street: null, cabeca: null, structure: null, component: null };

  if (selection.level === 'street' || !selection.structureId) {
    return { street, cabeca: null, structure: null, component: null };
  }

  const structure = findStructure(street, selection.structureId) ?? null;
  if (!structure) return { street, cabeca: null, structure: null, component: null };

  if (selection.level === 'structure' || !selection.componentId) {
    return { street, cabeca: null, structure, component: null };
  }

  const component =
    findComponent(structure, selection.componentId) ?? null;
  return { street, cabeca: null, structure, component };
}

export function rackTypeToStreetType(rackType: RackType): StreetType {
  if (rackType === 'drive-in') return 'zona-drive-in';
  if (rackType === 'pedestrian-path' || rackType === 'forklift-street') {
    return 'corredor-trafego';
  }
  return 'corredor-armazem';
}

export function isRackCompatibleWithStreet(
  rackType: RackType,
  streetType: StreetType,
): boolean {
  return rackTypeToStreetType(rackType) === streetType;
}

export function sideForNewStructure(street: LayoutStreet): 1 | 2 | undefined {
  if (street.type !== 'corredor-armazem') return undefined;
  const hasSide1 = street.structures.some((st) => st.side === 1);
  return hasSide1 ? 2 : 1;
}

export function findOrCreateStreetForRack(
  hierarchy: LayoutHierarchy,
  rackType: RackType,
  origin?: { x: number; y: number },
): { hierarchy: LayoutHierarchy; streetId: string; created: boolean } {
  const targetType = rackTypeToStreetType(rackType);
  const existing = hierarchy.streets.find((s) => s.type === targetType);
  if (existing) {
    return { hierarchy, streetId: existing.id, created: false };
  }

  const order = hierarchy.streets.length;
  const x = origin?.x ?? 80 + order * 120;
  const y = origin?.y ?? 80;
  const { hierarchy: next, streetId } = addStreetToHierarchy(hierarchy, targetType, x, y);
  return { hierarchy: next, streetId, created: true };
}

export function rackTypeToStructureKind(rackType: RackType): StructureKind {
  if (rackType === 'drive-in') return 'bloco-drive-in';
  if (rackType === 'flow-rack') return 'flow-rack-bloco';
  if (rackType === 'pedestrian-path') return 'faixa-pedestre';
  if (rackType === 'forklift-street') return 'faixa-empilhadeira';
  if (rackType === 'safety-barrier') return 'barreira-seguranca';
  return 'lado-estante';
}

export function streetTypeLabel(type: StreetType): string {
  const labels: Record<StreetType, string> = {
    'corredor-armazem': 'Corredor de armazém',
    'zona-drive-in': 'Zona drive-in',
    'corredor-trafego': 'Corredor de tráfego',
  };
  return labels[type];
}

export function addStreetToHierarchy(
  hierarchy: LayoutHierarchy,
  type: StreetType,
  x: number,
  y: number,
): { hierarchy: LayoutHierarchy; streetId: string } {
  const order = hierarchy.streets.length + 1;
  const id = nextStreetId();
  const street: LayoutStreet = {
    id,
    code: `RUA-${String(order).padStart(2, '0')}`,
    name: streetTypeLabel(type),
    type,
    order,
    x,
    y,
    structures: [],
  };
  return {
    hierarchy: { ...hierarchy, streets: [...hierarchy.streets, street] },
    streetId: id,
  };
}

export function addStructureToStreet(
  hierarchy: LayoutHierarchy,
  streetId: string,
  rackType: RackType,
  side?: 1 | 2,
): LayoutHierarchy {
  return {
    ...hierarchy,
    streets: hierarchy.streets.map((street) => {
      if (street.id !== streetId) return street;

      const kind = rackTypeToStructureKind(rackType);
      const size = defaultStructureSize(kind);
      const structId = nextStructureId();
      const structureCount = street.structures.length;

      const structure: LayoutStructure = {
        id: structId,
        streetId,
        code: `EST-${String(structureCount + 1).padStart(2, '0')}`,
        label: `${kind === 'lado-estante' ? `Lado ${side ?? 1}` : 'Bloco'} — ${rackType}`,
        kind,
        rackType: ['porta-palete', 'drive-in', 'flow-rack'].includes(rackType)
          ? rackType
          : undefined,
        side: kind === 'lado-estante' ? (side ?? 1) : undefined,
        x: structureCount * 40,
        y: structureCount * 100,
        widthPx: size.widthPx,
        heightPx: size.heightPx,
        components: [],
      };

      return { ...street, structures: [...street.structures, structure] };
    }),
  };
}

export function addComponentToStructure(
  hierarchy: LayoutHierarchy,
  streetId: string,
  structureId: string,
  rackType: RackType,
): LayoutHierarchy {
  return {
    ...hierarchy,
    streets: hierarchy.streets.map((street) => {
      if (street.id !== streetId) return street;
      return {
        ...street,
        structures: street.structures.map((structure) => {
          if (structure.id !== structureId) return structure;
          const component = createDefaultComponent(
            structureId,
            structure.components.length,
            rackType,
          );
          component.id = nextComponentId(structureId);
          return {
            ...structure,
            components: [...structure.components, component],
          };
        }),
      };
    }),
  };
}

export function removeNodeFromHierarchy(
  hierarchy: LayoutHierarchy,
  selection: LayoutSelection,
): LayoutHierarchy {
  if (selection.cabecaId) {
    return removeCabecaNodeFromHierarchy(hierarchy, selection);
  }

  if (selection.level === 'component' && selection.componentId && selection.structureId) {
    return {
      ...hierarchy,
      streets: hierarchy.streets.map((street) => {
        if (street.id !== selection.streetId) return street;
        return {
          ...street,
          structures: street.structures.map((structure) => {
            if (structure.id !== selection.structureId) return structure;
            return {
              ...structure,
              components: structure.components.filter(
                (c) => c.id !== selection.componentId,
              ),
            };
          }),
        };
      }),
    };
  }

  if (selection.level === 'structure' && selection.structureId) {
    return {
      ...hierarchy,
      streets: hierarchy.streets.map((street) => {
        if (street.id !== selection.streetId) return street;
        return {
          ...street,
          structures: street.structures.filter(
            (s) => s.id !== selection.structureId,
          ),
        };
      }),
    };
  }

  if (selection.streetId) {
    return {
      ...hierarchy,
      streets: hierarchy.streets.filter((s) => s.id !== selection.streetId!),
    };
  }

  return hierarchy;
}

export function updateStreetInHierarchy(
  hierarchy: LayoutHierarchy,
  streetId: string,
  patch: Partial<Pick<LayoutStreet, 'code' | 'name' | 'type' | 'x' | 'y'>>,
): LayoutHierarchy {
  return {
    ...hierarchy,
    streets: hierarchy.streets.map((s) =>
      s.id === streetId ? { ...s, ...patch } : s,
    ),
  };
}

export function updateStructureInHierarchy(
  hierarchy: LayoutHierarchy,
  streetId: string,
  structureId: string,
  patch: Partial<
    Pick<
      LayoutStructure,
      | 'code'
      | 'label'
      | 'kind'
      | 'rackType'
      | 'anchorStreetId'
      | 'side'
      | 'x'
      | 'y'
      | 'widthPx'
      | 'heightPx'
    >
  >,
): LayoutHierarchy {
  return {
    ...hierarchy,
    streets: hierarchy.streets.map((street) => {
      if (street.id !== streetId) return street;
      return {
        ...street,
        structures: street.structures.map((st) =>
          st.id === structureId ? { ...st, ...patch } : st,
        ),
      };
    }),
  };
}

export function updateComponentInHierarchy(
  hierarchy: LayoutHierarchy,
  streetId: string,
  structureId: string,
  componentId: string,
  patch: Partial<
    Pick<LayoutComponent, 'code' | 'label' | 'loadLevels' | 'capacityTon' | 'depthMm' | 'config'>
  >,
): LayoutHierarchy {
  return {
    ...hierarchy,
    streets: hierarchy.streets.map((street) => {
      if (street.id !== streetId) return street;
      return {
        ...street,
        structures: street.structures.map((structure) => {
          if (structure.id !== structureId) return structure;
          return {
            ...structure,
            components: structure.components.map((c) =>
              c.id === componentId ? { ...c, ...patch } : c,
            ),
          };
        }),
      };
    }),
  };
}

export function isDriveInStructureKind(
  structure: Pick<LayoutStructure, 'kind' | 'rackType'>,
): boolean {
  return structure.kind === 'bloco-drive-in' || structure.rackType === 'drive-in';
}

export function countDriveInStructures(hierarchy: LayoutHierarchy): number {
  return hierarchy.streets.reduce(
    (acc, street) =>
      acc + street.structures.filter((st) => isDriveInStructureKind(st)).length,
    0,
  );
}

export function canPublishLayout(hierarchy: LayoutHierarchy): boolean {
  return (
    countStorageComponents(hierarchy) > 0 ||
    countDriveInStructures(hierarchy) > 0
  );
}

export function countStorageComponents(hierarchy: LayoutHierarchy): number {
  const onStreets = hierarchy.streets.reduce(
    (acc, street) =>
      acc +
      street.structures.reduce(
        (a, st) =>
          a +
          st.components.filter((c) => c.kind === 'posicao-armazenagem').length,
        0,
      ),
    0,
  );
  const onCabecas = hierarchy.cabecas.reduce(
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
  return onStreets + onCabecas;
}
