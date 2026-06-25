import type {
  LayoutCabeca,
  LayoutHierarchy,
  LayoutStructure,
} from '@/features/layout-cd/types/layout-cd.schema';

function isLegacyCabecaStructure(structure: LayoutStructure): boolean {
  return (
    structure.placement === 'cabeca-inicio' || structure.placement === 'cabeca-fim'
  );
}

function legacyCabecaEnd(
  structure: LayoutStructure,
): 'inicio' | 'fim' {
  return structure.placement === 'cabeca-inicio' ? 'inicio' : 'fim';
}

/** Move cabeceiras que estavam presas a uma única rua para o nível transversal. */
export function migrateHierarchyCabecas(hierarchy: LayoutHierarchy): LayoutHierarchy {
  if (hierarchy.cabecas.length > 0) {
    return stripLegacyCabecaFromStreets(hierarchy);
  }

  const cabecas: LayoutCabeca[] = [];
  let cabecaOrder = 0;

  const streets = hierarchy.streets.map((street) => {
    const legacy = street.structures.filter(isLegacyCabecaStructure);
    const lateral = street.structures.filter((st) => !isLegacyCabecaStructure(st));

    for (const end of ['inicio', 'fim'] as const) {
      const group = legacy.filter((st) => legacyCabecaEnd(st) === end);
      if (group.length === 0) continue;

      cabecaOrder += 1;
      const cabecaId = `cabeca-mig-${cabecaOrder}`;
      cabecas.push({
        id: cabecaId,
        code: `CAB-${String(cabecaOrder).padStart(2, '0')}`,
        name: end === 'inicio' ? 'Início' : 'Fim',
        end,
        order: cabecaOrder,
        streetIds: [street.id],
        structures: group.map((st) => ({
          ...st,
          cabecaId,
          streetId: undefined,
          placement: undefined,
          side: undefined,
        })),
      });
    }

    return { ...street, structures: lateral };
  });

  return { streets, cabecas };
}

function stripLegacyCabecaFromStreets(hierarchy: LayoutHierarchy): LayoutHierarchy {
  return {
    cabecas: hierarchy.cabecas,
    streets: hierarchy.streets.map((street) => ({
      ...street,
      structures: street.structures
        .filter((st) => !isLegacyCabecaStructure(st))
        .map((st) => ({
          ...st,
          placement: st.placement === 'lateral' ? st.placement : undefined,
        })),
    })),
  };
}
