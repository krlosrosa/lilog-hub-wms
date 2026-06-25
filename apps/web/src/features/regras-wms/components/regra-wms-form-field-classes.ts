/** Shared Tailwind fragments for regras WMS (semantic tokens only). */
export const sectionCardClassName =
  'relative overflow-hidden rounded-lg border border-outline-variant bg-card p-3';

export const premiumCardClassName =
  'rounded-lg border border-outline-variant bg-card';

export const fieldLabelClassName =
  'block text-[10px] font-medium uppercase tracking-wide text-muted-foreground';

export const fieldInputClassName =
  'h-8 w-full rounded-md border border-outline-variant bg-surface-low px-2.5 text-caption text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60';

export const fieldErrorClassName = 'mt-0.5 text-[10px] text-destructive';

export const fieldSelectClassName = `${fieldInputClassName} appearance-none`;

export const conditionRowClassName =
  'group flex items-center gap-1.5 rounded-md border border-outline-variant/60 bg-surface-low/30 px-2 py-1.5 transition-colors hover:border-primary/25 hover:bg-surface-low/50';

export const sectionHeaderIconClassName =
  'flex size-6 shrink-0 items-center justify-center rounded bg-primary-container text-on-primary-container';
