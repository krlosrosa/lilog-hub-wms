import { cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';

import { hapticMedium } from '@/lib/haptics';

import type { LeadershipModule } from '../config/modules';

const ICON_TONE_CLASS: Record<LeadershipModule['iconTone'], string> = {
  secondary: 'bg-secondary-container text-on-secondary-container',
  primary: 'bg-primary-container text-on-primary-container',
  warning: 'bg-warning-container text-on-warning-container',
};

function FeaturedModuleCard({ module }: { module: LeadershipModule }) {
  const Icon = module.icon;
  const isAvailable = module.status === 'available' && module.to;

  const cardInner = (
    <>
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          ICON_TONE_CLASS[module.iconTone],
        )}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-body-md font-semibold text-on-surface">{module.title}</p>
        <p className="mt-0.5 line-clamp-1 text-body-sm text-on-surface-variant">
          {module.description}
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
  );

  const cardClassName = cn(
    'group flex items-center gap-4 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm',
    isAvailable
      ? 'active:bg-surface-container transition-colors touch-manipulation'
      : 'opacity-60',
  );

  if (isAvailable && module.to) {
    return (
      <Link
        to={module.to}
        onClick={() => hapticMedium()}
        className={cardClassName}
        aria-label={`Abrir ${module.title}`}
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

function ModuleCard({ module }: { module: LeadershipModule }) {
  const Icon = module.icon;
  const isAvailable = module.status === 'available' && module.to;

  const cardInner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            ICON_TONE_CLASS[module.iconTone],
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
      <p className="mt-3 text-body-md font-semibold text-on-surface">{module.title}</p>
      <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">
        {module.description}
      </p>
    </>
  );

  const cardClassName = cn(
    'flex h-full flex-col rounded-lg border border-outline-variant bg-surface p-4 shadow-sm',
    isAvailable
      ? 'active:bg-surface-container transition-colors touch-manipulation'
      : 'pointer-events-none opacity-50',
  );

  if (isAvailable && module.to) {
    return (
      <Link
        to={module.to}
        onClick={() => hapticMedium()}
        className={cardClassName}
        aria-label={`Abrir ${module.title}`}
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

export { FeaturedModuleCard, ModuleCard };
