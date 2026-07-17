'use client';

import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@lilog/ui';

import { panelSectionClassName } from '@/components/ui/panel-styles';

type CollapsiblePanelSectionProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function CollapsiblePanelSection({
  title,
  description,
  icon: Icon,
  defaultOpen,
  defaultExpanded,
  children,
  className,
}: CollapsiblePanelSectionProps) {
  const [open, setOpen] = useState(defaultExpanded ?? defaultOpen ?? true);

  return (
    <section className={cn(panelSectionClassName, className)}>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <div className="flex items-start gap-2">
          {Icon ? (
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : null}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {description ? (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        <ChevronDown
          className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open ? <div className="mt-4 space-y-4">{children}</div> : null}
    </section>
  );
}
