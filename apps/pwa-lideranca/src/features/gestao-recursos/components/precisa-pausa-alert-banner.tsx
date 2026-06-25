'use client';

import { cn } from '@lilog/ui';
import { AlertTriangle, Coffee } from 'lucide-react';

type PrecisaPausaAlertBannerProps = {
  count: number;
  atrasadosCount: number;
  className?: string;
};

export function PrecisaPausaAlertBanner({
  count,
  atrasadosCount,
  className,
}: PrecisaPausaAlertBannerProps) {
  if (count <= 0) {
    return null;
  }

  const isUrgent = atrasadosCount > 0;

  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-2.5 rounded-lg px-3 py-2.5',
        isUrgent
          ? 'border border-error/40 bg-error-container/25'
          : 'border border-warning/40 bg-warning-container/25',
        className,
      )}
    >
      {isUrgent ? (
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-error" aria-hidden />
      ) : (
        <Coffee className="mt-0.5 size-4 shrink-0 text-on-warning-container" aria-hidden />
      )}
      <div className="min-w-0">
        <p
          className={cn(
            'text-label-sm font-semibold',
            isUrgent ? 'text-error' : 'text-on-warning-container',
          )}
        >
          {count} operador{count === 1 ? '' : 'es'} precisam de pausa
          {atrasadosCount > 0
            ? ` · ${atrasadosCount} atrasado${atrasadosCount === 1 ? '' : 's'}`
            : ''}
        </p>
        <p className="text-[11px] text-on-surface-variant">
          Oriente o registro de pausa no sistema quando possível.
        </p>
      </div>
    </div>
  );
}
