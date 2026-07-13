import { cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';

import { hapticMedium } from '@/lib/haptics';

import type { OperationalAreaItem } from '../config/operational-areas';

const ICON_TONE_CLASS: Record<OperationalAreaItem['iconTone'], string> = {
  secondary: 'bg-secondary-container text-on-secondary-container',
  primary: 'bg-primary-container text-on-primary-container',
  warning: 'bg-warning-container text-on-warning-container',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
};

type AreaHubCardProps = {
  item: OperationalAreaItem;
  layout?: 'featured' | 'grid';
};

export function AreaHubCard({ item, layout = 'featured' }: AreaHubCardProps) {
  const Icon = item.icon;
  const isAvailable = item.status === 'available' && item.to;

  const cardClassName = cn(
    layout === 'featured'
      ? 'group flex items-center gap-4 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm'
      : 'flex h-full flex-col rounded-lg border border-outline-variant bg-surface p-4 shadow-sm',
    isAvailable
      ? 'active:bg-surface-container transition-colors touch-manipulation'
      : layout === 'featured'
        ? 'opacity-60'
        : 'pointer-events-none opacity-50',
  );

  const cardInner =
    layout === 'featured' ? (
      <>
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            ICON_TONE_CLASS[item.iconTone],
          )}
        >
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body-md font-semibold text-on-surface">{item.title}</p>
          <p className="mt-0.5 line-clamp-1 text-body-sm text-on-surface-variant">
            {item.description}
          </p>
        </div>
        {isAvailable ? (
          <ChevronRight className="h-5 w-5 shrink-0 text-outline" aria-hidden />
        ) : (
          <span className="inline-flex shrink-0 rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-medium text-on-surface-variant">
            Em breve
          </span>
        )}
      </>
    ) : (
      <>
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              ICON_TONE_CLASS[item.iconTone],
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          {isAvailable ? (
            <ChevronRight className="h-5 w-5 shrink-0 text-outline" aria-hidden />
          ) : (
            <span className="inline-flex shrink-0 rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-medium text-on-surface-variant">
              Em breve
            </span>
          )}
        </div>
        <p className="mt-3 text-body-md font-semibold text-on-surface">{item.title}</p>
        <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">
          {item.description}
        </p>
      </>
    );

  if (isAvailable && item.to) {
    return (
      <Link
        to={item.to}
        onClick={() => hapticMedium()}
        className={cardClassName}
        aria-label={`Abrir ${item.title}`}
      >
        {cardInner}
      </Link>
    );
  }

  return (
    <article className={cardClassName} aria-disabled="true">
      {cardInner}
    </article>
  );
}
