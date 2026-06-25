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
        'overflow-hidden rounded-xl border shadow-sm',
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
          'flex w-full items-center justify-between gap-3 px-4 py-3 text-left touch-manipulation',
          accent === 'warning'
            ? 'active:bg-warning-container/20'
            : 'active:bg-surface-container-low'
        )}
      >
        <h3 className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
          {title}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-lg bg-surface-container px-2 py-0.5 font-mono text-label-sm text-on-surface-variant">
            {count}
          </span>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-on-surface-variant" aria-hidden />
          ) : (
            <ChevronDown className="h-5 w-5 text-on-surface-variant" aria-hidden />
          )}
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-outline-variant/60 px-3 pb-3">
          {count === 0 ? (
            <p className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-3 py-4 text-center text-label-sm text-on-surface-variant">
              {emptyMessage}
            </p>
          ) : (
            <ul className="space-y-2 pt-2">{children}</ul>
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
        'flex items-start gap-2 rounded-lg border px-3 py-2.5',
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
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-error transition-colors active:bg-error-container/30 touch-manipulation"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
