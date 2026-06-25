import { cn } from '@lilog/ui';
import {
  ChevronRight,
  LogOut,
  MapPin,
  Snowflake,
  TriangleAlert,
  Truck,
} from 'lucide-react';
import type { HTMLAttributes } from 'react';

import type { CompanyCode, DemandTagVariant } from '../types/recebimento.schema';

import { CompanyAvatarGroup } from './company-avatar-group';
import { PriorityBadge } from './priority-badge';
import { StatusBadge } from './status-badge';

interface DemandCardProps extends HTMLAttributes<HTMLElement> {
  id: string;
  supplier: string;
  dock: string;
  arrival: string;
  companies: CompanyCode[];
  isPriority?: boolean;
  status?: string;
  pulse?: boolean;
  tagLabel?: string;
  tagVariant?: DemandTagVariant;
  skuCount?: number;
}

export function DemandCard({
  id,
  supplier,
  dock,
  arrival,
  companies,
  isPriority = false,
  status = 'Aguardando',
  pulse = false,
  tagLabel,
  tagVariant = 'default',
  skuCount,
  className,
  ...props
}: DemandCardProps) {
  const TagIcon = tagVariant === 'error' ? Snowflake : TriangleAlert;

  return (
    <article
      className={cn(
        'group flex items-center gap-2.5 overflow-hidden rounded-lg border border-outline-variant bg-surface p-3 shadow-sm',
        'transition-all duration-150 active:scale-[0.98] active:bg-surface-container-low touch-manipulation',
        isPriority && 'border-l-[3px] border-l-warning bg-warning/[0.03]',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
          isPriority
            ? 'bg-warning-container text-on-warning-container'
            : 'bg-secondary-container/80 text-on-secondary-container'
        )}
      >
        <Truck className="h-4 w-4" aria-hidden />
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="truncate font-mono text-label-md font-bold text-primary">{id}</span>
          <time
            dateTime={arrival}
            className={cn(
              'shrink-0 font-mono text-label-sm font-semibold tabular-nums',
              isPriority ? 'text-warning' : 'text-on-surface-variant'
            )}
          >
            {arrival}
          </time>
        </div>

        <p className="line-clamp-1 text-body-sm font-semibold text-on-surface">{supplier}</p>

        <div className="flex min-w-0 items-center gap-1 truncate text-body-sm text-on-surface-variant">
          <MapPin className="h-3 w-3 shrink-0 text-secondary" aria-hidden />
          <span className="truncate font-medium text-on-surface">{dock}</span>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-2 pt-0.5">
          <div className="flex min-w-0 items-center gap-1">
            <CompanyAvatarGroup companies={companies} size="compact" />
            {isPriority && <PriorityBadge />}
            {tagLabel && (
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-medium leading-none',
                  tagVariant === 'error'
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-surface-container-high text-on-surface-variant'
                )}
              >
                <TagIcon className="h-2.5 w-2.5 shrink-0" aria-hidden />
                {tagLabel}
              </span>
            )}
            {skuCount !== undefined && !tagLabel && !isPriority && (
              <span className="shrink-0 rounded-full bg-surface-container-high px-1.5 py-px font-mono text-[10px] font-semibold text-on-surface-variant">
                {skuCount} SKUs
              </span>
            )}
          </div>
          <StatusBadge label={status} pulse={pulse} compact className="shrink-0" />
        </div>
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-outline transition-transform group-active:translate-x-0.5"
        aria-hidden
      />
    </article>
  );
}
