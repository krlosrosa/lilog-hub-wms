'use client';

import { useState } from 'react';

import { cn } from '@lilog/ui';
import { ChevronRight } from 'lucide-react';

import {
  panelBodyClassName,
  panelClassName,
  panelHeaderClassName,
  sectionLabelClassName,
} from '@/features/expedicao-impressao-config/components/panel-styles';

type CollapsiblePanelSectionProps = {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  className?: string;
  defaultExpanded?: boolean;
  headerExtra?: React.ReactNode;
};

export function CollapsiblePanelSection({
  icon: Icon,
  title,
  children,
  className,
  defaultExpanded = true,
  headerExtra,
}: CollapsiblePanelSectionProps) {
  const [expandido, setExpandido] = useState(defaultExpanded);

  return (
    <section className={cn(panelClassName, className)}>
      <div className={cn(panelHeaderClassName, 'gap-2')}>
        <button
          type="button"
          onClick={() => setExpandido((prev) => !prev)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-0.5 py-0.5 text-left transition-colors hover:bg-surface-low/50"
          aria-expanded={expandido}
        >
          <ChevronRight
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform',
              expandido && 'rotate-90',
            )}
            aria-hidden
          />
          {Icon ? <Icon className="size-3.5 shrink-0 text-primary" aria-hidden /> : null}
          <h2 className="truncate text-xs font-semibold text-foreground">{title}</h2>
        </button>
        {headerExtra ? (
          <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
            {headerExtra}
          </div>
        ) : null}
      </div>
      {expandido ? <div className={panelBodyClassName}>{children}</div> : null}
    </section>
  );
}

type CollapsibleBlockProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  defaultExpanded?: boolean;
  headerExtra?: React.ReactNode;
};

export function CollapsibleBlock({
  title,
  description,
  children,
  className,
  defaultExpanded = true,
  headerExtra,
}: CollapsibleBlockProps) {
  const [expandido, setExpandido] = useState(defaultExpanded);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-low/20',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-outline-variant/40 bg-surface-low/40 px-3 py-2">
        <button
          type="button"
          onClick={() => setExpandido((prev) => !prev)}
          className="flex min-w-0 flex-1 items-start gap-2 rounded-md px-0.5 py-0.5 text-left transition-colors hover:bg-surface-low/60"
          aria-expanded={expandido}
        >
          <ChevronRight
            className={cn(
              'mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform',
              expandido && 'rotate-90',
            )}
            aria-hidden
          />
          <div className="min-w-0">
            <p className={sectionLabelClassName}>{title}</p>
            {description ? (
              <p className="mt-0.5 text-[10px] text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </button>
        {headerExtra ? (
          <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
            {headerExtra}
          </div>
        ) : null}
      </div>
      {expandido ? <div className="p-3">{children}</div> : null}
    </div>
  );
}
