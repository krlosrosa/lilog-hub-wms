import { cn } from '@lilog/ui';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { hapticLight } from '@/lib/haptics';

interface CollapsibleRecordCardProps {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  emptyMessage: string;
  accent?: 'default' | 'warning';
  children: ReactNode;
}

export function CollapsibleRecordCard({
  title,
  count,
  expanded,
  onToggle,
  emptyMessage,
  accent = 'default',
  children,
}: CollapsibleRecordCardProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-lg border shadow-sm',
        accent === 'warning'
          ? 'border-warning/30 bg-warning-container/10'
          : 'border-outline-variant bg-surface'
      )}
    >
      <button
        type="button"
        onClick={() => {
          hapticLight();
          onToggle();
        }}
        aria-expanded={expanded}
        className={cn(
          'flex w-full items-center justify-between gap-2 px-3 py-2 text-left touch-manipulation',
          accent === 'warning'
            ? 'active:bg-warning-container/20'
            : 'active:bg-surface-container-low'
        )}
      >
        <h3 className="text-xs font-semibold text-on-surface">{title}</h3>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-md bg-surface-container px-1.5 py-0.5 font-mono text-xs tabular-nums text-on-surface-variant">
            {count}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-on-surface-variant" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 text-on-surface-variant" aria-hidden />
          )}
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-outline-variant/60 px-2.5 pb-2">
          {count === 0 ? (
            <p className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-2.5 py-2.5 text-center text-xs text-on-surface-variant">
              {emptyMessage}
            </p>
          ) : (
            <ul className="space-y-1 pt-1">{children}</ul>
          )}
        </div>
      ) : null}
    </section>
  );
}

interface RecordListItemProps {
  onRemove: () => void;
  removeLabel: string;
  children: ReactNode;
  accent?: 'default' | 'warning';
}

export function RecordListItem({
  onRemove,
  removeLabel,
  children,
  accent = 'default',
}: RecordListItemProps) {
  return (
    <li
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5',
        accent === 'warning'
          ? 'border-warning/20 bg-surface/70'
          : 'border-outline-variant/80 bg-surface-container-low'
      )}
    >
      <div className="min-w-0 flex-1 space-y-0.5">{children}</div>
      <button
        type="button"
        aria-label={removeLabel}
        onClick={() => {
          hapticLight();
          onRemove();
        }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-error transition-colors active:bg-error-container/30 touch-manipulation"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
