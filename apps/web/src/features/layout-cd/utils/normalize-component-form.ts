import type {
  ComponentForm,
  LayoutHierarchy,
} from '@/features/layout-cd/types/layout-cd.schema';

/** Rótulos padrão gerados automaticamente (ex.: "Posição 1") — não exibir na UI. */
export function isGenericPositionLabel(label: string): boolean {
  const trimmed = label.trim();
  return /^Posição\s*\d*$/i.test(trimmed);
}

export function sanitizeComponentLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed || isGenericPositionLabel(trimmed)) return '';
  return trimmed;
}

export function getComponentDisplayLabel(component: {
  code: string;
  label: string;
}): string | null {
  const display = sanitizeComponentLabel(component.label);
  if (!display || display === component.code.trim()) return null;
  return display;
}

export function sanitizeHierarchyLabels(
  hierarchy: LayoutHierarchy,
): LayoutHierarchy {
  return {
    cabecas: hierarchy.cabecas ?? [],
    streets: hierarchy.streets.map((street) => ({
      ...street,
      structures: street.structures.map((structure) => ({
        ...structure,
        components: structure.components.map((component) => ({
          ...component,
          label: sanitizeComponentLabel(component.label),
        })),
      })),
    })),
  };
}

export function normalizeComponentForm(data: ComponentForm): ComponentForm {
  const loadLevels = Math.min(
    12,
    Math.max(1, Math.round(Number(data.loadLevels)) || 1),
  );
  const capacityTon = Math.max(0.1, Number(data.capacityTon) || 1);
  const depthMm = Math.max(1, Math.round(Number(data.depthMm)) || 800);

  return {
    code: String(data.code ?? '').trim() || 'P01',
    label: sanitizeComponentLabel(String(data.label ?? '')),
    kind: data.kind,
    loadLevels,
    capacityTon,
    depthMm,
  };
}
