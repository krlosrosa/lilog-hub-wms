'use client';

import { cn } from '@lilog/ui';

type RegraStatusBadgeProps = {
  ativo: boolean;
  compact?: boolean;
};

export function RegraStatusBadge({ ativo, compact }: RegraStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        ativo
          ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
          : 'bg-muted text-muted-foreground ring-1 ring-outline-variant',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          ativo ? 'bg-primary' : 'bg-muted-foreground',
        )}
        aria-hidden
      />
      {ativo ? 'Ativa' : 'Inativa'}
    </span>
  );
}
