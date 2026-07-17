import { cn } from '@lilog/ui';

export const panelClassName = cn(
  'overflow-hidden rounded-xl border border-outline-variant',
  'bg-glass-bg shadow-inner-glow backdrop-blur-glass',
);

export const panelHeaderClassName =
  'flex items-center justify-between gap-2 border-b border-outline-variant bg-surface-low/30 px-3 py-2';

export const panelBodyClassName = 'p-3';

export const sectionLabelClassName =
  'text-[10px] font-semibold uppercase tracking-wider text-muted-foreground';

export const fieldInputClassName = cn(
  'w-full rounded-md border border-outline-variant bg-surface-low px-2.5 py-1.5',
  'text-xs text-foreground placeholder:text-muted-foreground',
  'focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring',
);

export const segmentGroupClassName =
  'inline-flex rounded-md border border-outline-variant bg-surface-low p-0.5';

export function segmentButtonClassName(active: boolean) {
  return cn(
    'rounded px-2.5 py-1 text-[11px] font-semibold transition-colors',
    active
      ? 'bg-primary text-on-primary shadow-sm'
      : 'text-muted-foreground hover:text-foreground',
  );
}

export const panelSectionClassName =
  'rounded-xl border border-outline-variant bg-card p-4 shadow-sm';
