'use client';

import { cn } from '@lilog/ui';
import { Moon } from 'lucide-react';

type EscalaTurnoBadgeProps = {
  cruzaMeiaNoite: boolean;
  className?: string;
};

export function EscalaTurnoBadge({
  cruzaMeiaNoite,
  className,
}: EscalaTurnoBadgeProps) {
  if (!cruzaMeiaNoite) {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-caption font-semibold text-secondary',
        className,
      )}
    >
      <Moon className="size-3" aria-hidden />
      Noturno
    </span>
  );
}
