import { cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { hapticLight } from '@/lib/haptics';

export interface SessaoSubHeaderProps {
  backTo: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}

export function SessaoSubHeader({
  backTo,
  backLabel,
  title,
  subtitle,
  trailing,
}: SessaoSubHeaderProps) {
  return (
    <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-margin-mobile">
        <Link
          to={backTo}
          aria-label={backLabel}
          onPointerDown={() => hapticLight()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-label-sm text-on-surface-variant">{subtitle}</p>
          ) : null}
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </div>
  );
}

export function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-label-sm whitespace-nowrap transition-colors touch-manipulation active:scale-95',
        active
          ? 'bg-secondary text-on-secondary'
          : 'bg-surface-container text-on-surface-variant',
      )}
    >
      {label}
      {count !== undefined ? (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
            active
              ? 'bg-on-secondary/20 text-on-secondary'
              : 'bg-outline-variant/30 text-on-surface-variant',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
