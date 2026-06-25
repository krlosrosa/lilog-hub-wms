import { cn } from '@lilog/ui';

/** Shared compact table styling used across Cadastros list views. */
export const compactTableClassName =
  'w-full border-collapse text-left text-xs';

export const compactTableHeadRowClassName =
  'sticky top-0 z-10 bg-surface-highest/50 backdrop-blur-md';

export const compactTableBodyClassName =
  'divide-y divide-outline-variant/30';

export const compactTableRowClassName =
  'group transition-colors hover:bg-surface-highest/50';

export const compactTableCellClassName = 'px-2 py-1.5';

export const compactTableEmptyCellClassName =
  'px-2 py-12 text-center text-xs text-muted-foreground';

export function compactTableHeadCellClassName(className?: string) {
  return cn(
    'border-b border-outline-variant px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
    className,
  );
}
