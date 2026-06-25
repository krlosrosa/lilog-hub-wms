import { DEFAULT_ITEM_SIZES } from '@/features/layout-cd/mocks/layout-cd.mock';
import type {
  CanvasItem,
  LayoutComponent,
  LayoutHierarchy,
  LayoutStreet,
  LayoutStructure,
  RackType,
  StreetType,
  StructureKind,
} from '@/features/layout-cd/types/layout-cd.schema';

function defaultConfigForType(type: RackType) {
  return {
    heightPerLevelMm: 2200,
    positionsPerLevel: 3 as const,
    capacityKg: 1200,
    storageLogic: 'fefo' as const,
    rackType: type,
    activeLevel: 3,
  };
}

function canvasTypeToStreetType(type: RackType): StreetType {
  if (type === 'drive-in') return 'zona-drive-in';
  if (type === 'pedestrian-path' || type === 'forklift-street') {
    return 'corredor-trafego';
  }
  return 'corredor-armazem';
}

function canvasTypeToStructureKind(type: RackType): StructureKind {
  if (type === 'drive-in') return 'bloco-drive-in';
  if (type === 'flow-rack') return 'flow-rack-bloco';
  if (type === 'pedestrian-path') return 'faixa-pedestre';
  if (type === 'forklift-street') return 'faixa-empilhadeira';
  if (type === 'safety-barrier') return 'barreira-seguranca';
  return 'lado-estante';
}

function canvasItemToComponent(item: CanvasItem, index: number): LayoutComponent {
  return {
    id: `${item.id}-cmp`,
    code: `P${String(index + 1).padStart(2, '0')}`,
    label: '',
    kind: 'posicao-armazenagem',
    loadLevels: item.loadLevels,
    capacityTon: item.capacityTon,
    depthMm: item.depthMm,
    config: item.config,
  };
}

function canvasItemToStructure(item: CanvasItem, streetId: string): LayoutStructure {
  const kind = canvasTypeToStructureKind(item.type);
  const slots = Math.max(1, Math.round(item.widthPx / 40));
  const components: LayoutComponent[] = [];

  if (['porta-palete', 'drive-in', 'flow-rack'].includes(item.type)) {
    for (let i = 0; i < slots; i += 1) {
      components.push(canvasItemToComponent(item, i));
    }
  }

  return {
    id: item.id,
    streetId,
    code: item.id.replace('item-', 'EST-'),
    label: item.label,
    kind,
    rackType: ['porta-palete', 'drive-in', 'flow-rack'].includes(item.type)
      ? item.type
      : undefined,
    side: kind === 'lado-estante' ? 1 : undefined,
    x: 0,
    y: 0,
    widthPx: item.widthPx,
    heightPx: item.heightPx,
    components,
  };
}

/** Converte layout legado (canvas flat) para hierarquia rua → estrutura → componente. */
export function canvasItemsToHierarchy(items: CanvasItem[]): LayoutHierarchy {
  const streetMap = new Map<string, LayoutStreet>();

  items.forEach((item, index) => {
    const streetType = canvasTypeToStreetType(item.type);
    const streetKey = streetType;

    let street = streetMap.get(streetKey);
    if (!street) {
      const order = streetMap.size + 1;
      street = {
        id: `street-mig-${order}`,
        code: `RUA-${String(order).padStart(2, '0')}`,
        name:
          streetType === 'zona-drive-in'
            ? 'Zona Drive-in'
            : streetType === 'corredor-trafego'
              ? 'Corredor de Tráfego'
              : 'Corredor de Armazém',
        type: streetType,
        order,
        x: item.x,
        y: item.y,
        structures: [],
      };
      streetMap.set(streetKey, street);
    }

    const structure = canvasItemToStructure(item, street.id);
    structure.x = item.x - street.x;
    structure.y = item.y - street.y;
    street.structures.push(structure);

    if (index === 0 || item.y < street.y) {
      street.y = item.y;
      street.x = item.x;
    }
  });

  return { streets: Array.from(streetMap.values()), cabecas: [] };
}

/** Cria componente padrão para nova posição em estrutura de armazenagem. */
export function createDefaultComponent(
  structureId: string,
  index: number,
  rackType: RackType,
): LayoutComponent {
  const id = `${structureId}-cmp-${String(index + 1).padStart(3, '0')}`;
  return {
    id,
    code: `P${String(index + 1).padStart(2, '0')}`,
    label: '',
    kind: 'posicao-armazenagem',
    loadLevels: 4,
    capacityTon: 1.2,
    depthMm: 800,
    config: defaultConfigForType(rackType),
  };
}

export function defaultStructureSize(kind: StructureKind): {
  widthPx: number;
  heightPx: number;
} {
  switch (kind) {
    case 'bloco-drive-in':
      return DEFAULT_ITEM_SIZES['drive-in'];
    case 'flow-rack-bloco':
      return DEFAULT_ITEM_SIZES['flow-rack'];
    case 'faixa-pedestre':
      return DEFAULT_ITEM_SIZES['pedestrian-path'];
    case 'faixa-empilhadeira':
      return DEFAULT_ITEM_SIZES['forklift-street'];
    case 'barreira-seguranca':
      return DEFAULT_ITEM_SIZES['safety-barrier'];
    default:
      return DEFAULT_ITEM_SIZES['porta-palete'];
  }
}
