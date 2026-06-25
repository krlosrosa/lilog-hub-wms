import type {
  CabecaEnd,
  LayoutCabeca,
  LayoutComponent,
  LayoutHierarchy,
  LayoutSelection,
  LayoutStructure,
  RackType,
} from '@/features/layout-cd/types/layout-cd.schema';

import {
  createDefaultComponent,
  defaultStructureSize,
} from '@/features/layout-cd/utils/canvas-to-hierarchy';
import { rackTypeToStructureKind } from '@/features/layout-cd/utils/layout-hierarchy-ops';

let cabecaCounter = 10;

export function nextCabecaId(): string {
  cabecaCounter += 1;
  return `cabeca-${String(cabecaCounter).padStart(3, '0')}`;
}

export function findCabeca(
  hierarchy: LayoutHierarchy,
  cabecaId: string,
): LayoutCabeca | undefined {
  return hierarchy.cabecas.find((c) => c.id === cabecaId);
}

export function findStructureInCabeca(
  cabeca: LayoutCabeca,
  structureId: string,
): LayoutStructure | undefined {
  return cabeca.structures.find((s) => s.id === structureId);
}

export function findComponentInCabecaStructure(
  structure: LayoutStructure,
  componentId: string,
): LayoutComponent | undefined {
  return structure.components.find((c) => c.id === componentId);
}

export function cabecaEndLabel(end: CabecaEnd): string {
  return end === 'inicio' ? 'Início' : 'Fim';
}

export function warehouseStreetIds(hierarchy: LayoutHierarchy): string[] {
  return hierarchy.streets
    .filter((s) => s.type === 'corredor-armazem')
    .sort((a, b) => a.order - b.order)
    .map((s) => s.id);
}

export function addCabecaToHierarchy(
  hierarchy: LayoutHierarchy,
  end: CabecaEnd,
  streetIds: string[],
): { hierarchy: LayoutHierarchy; cabecaId: string } {
  const order = hierarchy.cabecas.length + 1;
  const id = nextCabecaId();
  const cabeca: LayoutCabeca = {
    id,
    code: `CAB-${String(order).padStart(2, '0')}`,
    name: cabecaEndLabel(end),
    end,
    order,
    streetIds,
    structures: [],
  };
  return {
    hierarchy: { ...hierarchy, cabecas: [...hierarchy.cabecas, cabeca] },
    cabecaId: id,
  };
}

export function updateCabecaInHierarchy(
  hierarchy: LayoutHierarchy,
  cabecaId: string,
  patch: Partial<Pick<LayoutCabeca, 'code' | 'name' | 'end' | 'streetIds'>>,
): LayoutHierarchy {
  return {
    ...hierarchy,
    cabecas: hierarchy.cabecas.map((c) =>
      c.id === cabecaId ? { ...c, ...patch } : c,
    ),
  };
}

export function addStructureToCabeca(
  hierarchy: LayoutHierarchy,
  cabecaId: string,
  rackType: RackType,
  anchorStreetId?: string,
): LayoutHierarchy {
  return {
    ...hierarchy,
    cabecas: hierarchy.cabecas.map((cabeca) => {
      if (cabeca.id !== cabecaId) return cabeca;

      const kind = rackTypeToStructureKind(rackType);
      if (kind !== 'lado-estante' && kind !== 'flow-rack-bloco') {
        return cabeca;
      }

      const structId = `str-cab-${cabeca.structures.length + 1}`;
      const anchor =
        anchorStreetId && cabeca.streetIds.includes(anchorStreetId)
          ? anchorStreetId
          : cabeca.streetIds[0];
      const size = defaultStructureSize(kind);
      const structure: LayoutStructure = {
        id: structId,
        cabecaId,
        code: `EST-${String(cabeca.structures.length + 1).padStart(2, '0')}`,
        label: `Bloco — ${rackType}`,
        kind,
        rackType: ['porta-palete', 'drive-in', 'flow-rack'].includes(rackType)
          ? rackType
          : undefined,
        anchorStreetId: anchor,
        x: 0,
        y: 0,
        widthPx: size.widthPx,
        heightPx: size.heightPx,
        components: [],
      };

      return {
        ...cabeca,
        structures: [...cabeca.structures, structure],
      };
    }),
  };
}

export function addComponentToCabecaStructure(
  hierarchy: LayoutHierarchy,
  cabecaId: string,
  structureId: string,
  rackType: RackType,
): LayoutHierarchy {
  return {
    ...hierarchy,
    cabecas: hierarchy.cabecas.map((cabeca) => {
      if (cabeca.id !== cabecaId) return cabeca;
      return {
        ...cabeca,
        structures: cabeca.structures.map((structure) => {
          if (structure.id !== structureId) return structure;
          const component = createDefaultComponent(
            structureId,
            structure.components.length,
            rackType,
          );
          component.id = `cmp-${structureId}-${structure.components.length + 1}`;
          return {
            ...structure,
            components: [...structure.components, component],
          };
        }),
      };
    }),
  };
}

export function updateStructureInCabeca(
  hierarchy: LayoutHierarchy,
  cabecaId: string,
  structureId: string,
  patch: Partial<
    Pick<
      LayoutStructure,
      'code' | 'label' | 'kind' | 'rackType' | 'anchorStreetId' | 'x' | 'y' | 'widthPx' | 'heightPx'
    >
  >,
): LayoutHierarchy {
  return {
    ...hierarchy,
    cabecas: hierarchy.cabecas.map((cabeca) => {
      if (cabeca.id !== cabecaId) return cabeca;
      return {
        ...cabeca,
        structures: cabeca.structures.map((st) =>
          st.id === structureId ? { ...st, ...patch } : st,
        ),
      };
    }),
  };
}

export function updateComponentInCabeca(
  hierarchy: LayoutHierarchy,
  cabecaId: string,
  structureId: string,
  componentId: string,
  patch: Partial<
    Pick<LayoutComponent, 'code' | 'label' | 'loadLevels' | 'capacityTon' | 'depthMm' | 'config'>
  >,
): LayoutHierarchy {
  return {
    ...hierarchy,
    cabecas: hierarchy.cabecas.map((cabeca) => {
      if (cabeca.id !== cabecaId) return cabeca;
      return {
        ...cabeca,
        structures: cabeca.structures.map((structure) => {
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

export function removeCabecaNodeFromHierarchy(
  hierarchy: LayoutHierarchy,
  selection: LayoutSelection,
): LayoutHierarchy {
  if (
    selection.level === 'component' &&
    selection.cabecaId &&
    selection.structureId &&
    selection.componentId
  ) {
    return {
      ...hierarchy,
      cabecas: hierarchy.cabecas.map((cabeca) => {
        if (cabeca.id !== selection.cabecaId) return cabeca;
        return {
          ...cabeca,
          structures: cabeca.structures.map((structure) => {
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

  if (selection.level === 'structure' && selection.cabecaId && selection.structureId) {
    return {
      ...hierarchy,
      cabecas: hierarchy.cabecas.map((cabeca) => {
        if (cabeca.id !== selection.cabecaId) return cabeca;
        return {
          ...cabeca,
          structures: cabeca.structures.filter(
            (s) => s.id !== selection.structureId,
          ),
        };
      }),
    };
  }

  if (selection.level === 'cabeca' && selection.cabecaId) {
    return {
      ...hierarchy,
      cabecas: hierarchy.cabecas.filter((c) => c.id !== selection.cabecaId),
    };
  }

  return hierarchy;
}

export function countCabecaStorageComponents(hierarchy: LayoutHierarchy): number {
  return hierarchy.cabecas.reduce(
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
}
