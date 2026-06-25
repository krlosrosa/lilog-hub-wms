import { cn } from '@lilog/ui';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type SectionHeaderTone = 'default' | 'danger' | 'warning' | 'success';

const TONE_CLASS: Record<
  SectionHeaderTone,
  { icon: string; badge?: string }
> = {
  default: {
    icon: 'bg-secondary-container text-on-secondary-container',
  },
  danger: {
    icon: 'bg-destructive/15 text-destructive',
    badge: 'bg-destructive/10 text-destructive',
  },
  warning: {
    icon: 'bg-warning-container text-on-warning-container',
    badge: 'bg-warning-container text-on-warning-container',
  },
  success: {
    icon: 'bg-tertiary-container/30 text-tertiary',
    badge: 'bg-tertiary-container/30 text-tertiary',
  },
};

type SectionHeaderProps = {
  icon: LucideIcon;
  title: string;
  badge?: string | number;
  action?: ReactNode;
  tone?: SectionHeaderTone;
  compact?: boolean;
  className?: string;
};

export function SectionHeader({
  icon: Icon,
  title,
  badge,
  action,
  tone = 'default',
  compact = false,
  className,
}: SectionHeaderProps) {
  const styles = TONE_CLASS[tone];
  const iconSize = compact ? 'h-7 w-7 rounded-lg' : 'h-9 w-9 rounded-xl';

  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <div className="flex min-w-0 items-center gap-2">
        <div
          className={cn(
            'flex shrink-0 items-center justify-center shadow-sm',
            iconSize,
            styles.icon,
          )}
        >
          <Icon className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} aria-hidden />
        </div>
        <h2
          className={cn(
            'truncate font-semibold text-on-surface',
            compact ? 'text-label-sm' : 'text-label-md',
          )}
        >
          {title}
        </h2>
        {badge !== undefined ? (
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums',
              styles.badge ?? 'bg-surface-container text-on-surface-variant',
            )}
          >
            {badge}
          </span>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
