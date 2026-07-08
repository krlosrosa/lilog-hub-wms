import type { ArmazemLayoutSlotOcupacaoApi } from '@/features/armazem-layout/api';

export const STATUS_COLORS = {
  disponivel: {
    bgClass: 'bg-status-active/20',
    borderClass: 'border-status-active/50',
    textClass: 'text-status-active',
    label: 'Disponível',
  },
  ocupado: {
    bgClass: 'bg-primary/25',
    borderClass: 'border-primary/50',
    textClass: 'text-primary',
    label: 'Ocupado',
  },
  bloqueado: {
    bgClass: 'bg-destructive/20',
    borderClass: 'border-destructive/50',
    textClass: 'text-destructive',
    label: 'Bloqueado',
  },
  inventario: {
    bgClass: 'bg-tertiary/20',
    borderClass: 'border-tertiary/50',
    textClass: 'text-tertiary',
    label: 'Inventário',
  },
  inativo: {
    bgClass: 'bg-muted/30',
    borderClass: 'border-muted-foreground/40',
    textClass: 'text-muted-foreground',
    label: 'Inativo',
  },
  semVinculo: {
    bgClass: 'bg-muted/20',
    borderClass: 'border-outline-variant/60',
    textClass: 'text-muted-foreground',
    label: 'Sem endereço',
  },
} as const;

export type OcupacaoStatusKey = keyof typeof STATUS_COLORS;

export function getSlotOcupacaoStyle(slot: ArmazemLayoutSlotOcupacaoApi | null | undefined) {
  if (!slot?.endereco) {
    return STATUS_COLORS.semVinculo;
  }

  return STATUS_COLORS[slot.endereco.status] ?? STATUS_COLORS.disponivel;
}

export function getSlotOcupacaoTooltip(slot: ArmazemLayoutSlotOcupacaoApi | null | undefined): string {
  if (!slot?.endereco) {
    return `Nível ${slot?.nivel ?? '?'} · Sem endereço vinculado`;
  }

  const percent = Math.round(Number(slot.endereco.ocupacaoPercent ?? 0));
  return `${slot.endereco.enderecoMascarado} · ${percent}% · ${STATUS_COLORS[slot.endereco.status]?.label ?? slot.endereco.status}`;
}

export function getSlotsForElement(
  elementClientKey: string,
  slots: ArmazemLayoutSlotOcupacaoApi[],
): ArmazemLayoutSlotOcupacaoApi[] {
  return slots.filter((slot) => slot.elementClientKey === elementClientKey);
}

export function getElementOcupacaoStyle(
  elementClientKey: string,
  slots: ArmazemLayoutSlotOcupacaoApi[],
) {
  const elementSlots = getSlotsForElement(elementClientKey, slots);
  const linked = elementSlots.filter((slot) => slot.endereco);

  if (linked.length === 0) {
    return null;
  }

  const dominant =
    linked.find((slot) => slot.endereco?.status === 'bloqueado') ??
    linked.find((slot) => slot.endereco?.status === 'ocupado') ??
    linked.find((slot) => slot.endereco?.status === 'inventario') ??
    linked[0]!;

  const status = dominant.endereco?.status ?? 'disponivel';
  return STATUS_COLORS[status];
}

export function getElementOcupacaoSummary(
  elementClientKey: string,
  slots: ArmazemLayoutSlotOcupacaoApi[],
): string | null {
  const elementSlots = getSlotsForElement(elementClientKey, slots);
  const linked = elementSlots.filter((slot) => slot.endereco);

  if (linked.length === 0) {
    return 'Sem endereço vinculado';
  }

  const avg =
    linked.reduce(
      (sum, slot) => sum + Number(slot.endereco?.ocupacaoPercent ?? 0),
      0,
    ) / linked.length;

  return `${Math.round(avg)}% ocupação · ${linked.length} endereço(s)`;
}
