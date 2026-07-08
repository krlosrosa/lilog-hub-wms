import type { LucideIcon } from 'lucide-react';

import { cn } from '@lilog/ui';

type DetalheSectionProps = {
  id?: string;
  title: string;
  icon?: LucideIcon;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noBodyPadding?: boolean;
};

export function DetalheSection({
  id,
  title,
  icon: Icon,
  description,
  action,
  badge,
  children,
  className,
  bodyClassName,
  noBodyPadding = false,
}: DetalheSectionProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-lg border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass',
        className,
      )}
      aria-labelledby={id}
    >
      <div className="flex items-start justify-between gap-2 border-b border-outline-variant bg-surface-low px-3 py-2">
        <div className="min-w-0">
          <h2
            id={id}
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
          >
            {Icon ? <Icon className="size-3.5 shrink-0 text-primary" aria-hidden /> : null}
            {title}
            {badge}
          </h2>
          {description ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn(!noBodyPadding && 'p-3', bodyClassName)}>{children}</div>
    </section>
  );
}
