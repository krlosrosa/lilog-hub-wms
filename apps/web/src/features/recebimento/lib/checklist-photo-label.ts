const SLOT_LABELS: Record<string, string> = {
  lacre: 'Lacre',
  'bau-fechado': 'Baú fechado',
  'bau-aberto': 'Baú aberto',
  extras: 'Extra',
};

const SLOT_ORDER = ['lacre', 'bau-fechado', 'bau-aberto', 'extras'] as const;

export function resolveChecklistPhotoSlot(nome: string): string {
  const withoutExt = nome.replace(/\.[^.]+$/, '');
  const parts = withoutExt.split('-');

  if (parts[0] !== 'checklist' || parts.length < 3) {
    return 'outros';
  }

  return parts.slice(1, -1).join('-');
}

export function resolveChecklistPhotoLabel(nome: string): string {
  const slot = resolveChecklistPhotoSlot(nome);
  return SLOT_LABELS[slot] ?? 'Foto';
}

export function compareChecklistPhotos(a: string, b: string): number {
  const slotA = resolveChecklistPhotoSlot(a);
  const slotB = resolveChecklistPhotoSlot(b);
  const indexA = SLOT_ORDER.indexOf(slotA as (typeof SLOT_ORDER)[number]);
  const indexB = SLOT_ORDER.indexOf(slotB as (typeof SLOT_ORDER)[number]);
  const orderA = indexA === -1 ? SLOT_ORDER.length : indexA;
  const orderB = indexB === -1 ? SLOT_ORDER.length : indexB;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return a.localeCompare(b);
}
