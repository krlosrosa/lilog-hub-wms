'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { cn } from '@lilog/ui';

import type { RackItem } from '@/features/passagem-bastao/types/passagem-bastao.schema';

export type RackItemRowProps = {
  item: RackItem;
};

export function RackItemRow({ item }: RackItemRowProps) {
  const isCritico = item.status === 'critico';

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border-l-2 bg-surface-low px-2 py-1.5',
        isCritico ? 'border-destructive' : 'border-tertiary',
      )}
    >
      <div
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded',
          isCritico ? 'bg-destructive/20' : 'bg-tertiary/20',
        )}
      >
        {isCritico ? (
          <AlertTriangle className="size-3.5 text-destructive" aria-hidden />
        ) : (
          <CheckCircle2 className="size-3.5 text-tertiary" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="truncate text-[11px] font-semibold text-foreground">
          {item.setor}
        </p>
        <p className="truncate font-mono text-[9px] text-muted-foreground">
          {item.detalhe}
        </p>
      </div>
    </div>
  );
}
