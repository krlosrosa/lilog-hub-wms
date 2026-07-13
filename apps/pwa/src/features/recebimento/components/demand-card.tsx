import { cn } from '@lilog/ui';
import {
  ChevronRight,
  MapPin,
  Snowflake,
  TriangleAlert,
  Truck,
  UserRound,
} from 'lucide-react';
import type { HTMLAttributes } from 'react';

import type { CompanyCode } from '../types/recebimento.schema';
import { formatConferenteLabel } from '../lib/resolve-conferente-info';

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
  tagVariant?: 'default' | 'error';
  skuCount?: number;
  placa?: string | null;
  conferenteMatricula?: string | null;
  conferente?: string | null;
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
  placa,
  conferenteMatricula,
  conferente,
  className,
  ...props
}: DemandCardProps) {
  const TagIcon = tagVariant === 'error' ? Snowflake : TriangleAlert;
  const placaTrimmed = placa?.trim() || null;
  const conferenteLabel = formatConferenteLabel({
    conferenteMatricula: conferenteMatricula?.trim() || null,
    conferente: conferente?.trim() || null,
  });
  const primaryLabel = placaTrimmed || supplier || id;
  const showSupplierBelow = Boolean(placaTrimmed && supplier);

  return (
    <article
      className={cn(
        'group flex items-center gap-2 overflow-hidden rounded-lg border border-outline-variant bg-surface p-2.5 shadow-sm',
        'transition-all duration-150 active:scale-[0.98] active:bg-surface-container-low touch-manipulation',
        isPriority && 'border-l-[3px] border-l-warning bg-warning/[0.03]',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
          isPriority
            ? 'bg-warning-container text-on-warning-container'
            : 'bg-secondary-container/80 text-on-secondary-container'
        )}
      >
        <Truck className="h-3.5 w-3.5" aria-hidden />
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span
            className={cn(
              'truncate font-mono text-label-md font-bold text-primary',
              placaTrimmed && 'uppercase tracking-wide'
            )}
          >
            {primaryLabel}
          </span>
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

        {showSupplierBelow ? (
          <p className="truncate text-body-sm font-medium text-on-surface">{supplier}</p>
        ) : null}

        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1 truncate text-label-sm text-on-surface-variant">
            <MapPin className="h-3 w-3 shrink-0 text-secondary" aria-hidden />
            <span className="truncate font-medium text-on-surface">{dock}</span>
          </span>
          <StatusBadge label={status} pulse={pulse} compact className="shrink-0" />
        </div>

        {(conferenteLabel || tagLabel || skuCount !== undefined || companies.length > 0 || isPriority) && (
          <div className="flex min-w-0 items-center gap-1 pt-px">
            <CompanyAvatarGroup companies={companies} size="compact" />
            {isPriority ? <PriorityBadge /> : null}
            {tagLabel ? (
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
            ) : null}
            {skuCount !== undefined && !tagLabel && !isPriority ? (
              <span className="shrink-0 rounded-full bg-surface-container-high px-1.5 py-px font-mono text-[10px] font-semibold text-on-surface-variant">
                {skuCount} SKUs
              </span>
            ) : null}
            {conferenteLabel ? (
              <span className="inline-flex min-w-0 max-w-[55%] shrink items-center gap-0.5 truncate rounded-full bg-surface-container-high px-1.5 py-px text-[10px] font-medium text-on-surface-variant">
                <UserRound className="h-2.5 w-2.5 shrink-0" aria-hidden />
                <span className="truncate">{conferenteLabel}</span>
              </span>
            ) : null}
          </div>
        )}
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-outline transition-transform group-active:translate-x-0.5"
        aria-hidden
      />
    </article>
  );
}
