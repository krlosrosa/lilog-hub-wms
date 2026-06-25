import { cn } from '@lilog/ui';
import {
  AlertCircle,
  ChevronRight,
  Clock,
  PackagePlus,
  Warehouse,
} from 'lucide-react';
import type { HTMLAttributes } from 'react';

import { hapticLight } from '@/lib/haptics';

import type { ArmazenagemPriority } from '../types/armazenagem.schema';

const PRIORITY_LABELS: Record<ArmazenagemPriority, string> = {
  urgente: 'Urgente',
  normal: 'Normal',
};

interface ArmazenagemDemandCardProps extends HTMLAttributes<HTMLButtonElement> {
  id: string;
  origem: string;
  zona: string;
  priority: ArmazenagemPriority;
  itemCount: number;
  storedCount: number;
  isPriority?: boolean;
  timeAgo?: string;
  tag?: string;
  onStart: () => void;
}

function MetaChip({
  isPriority,
  tag,
  timeAgo,
}: Pick<ArmazenagemDemandCardProps, 'isPriority' | 'tag' | 'timeAgo'>) {
  if (isPriority) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-1.5 py-px text-[10px] font-medium text-destructive">
        <AlertCircle className="h-2.5 w-2.5 shrink-0" aria-hidden />
        Urgente
      </span>
    );
  }

  if (tag) {
    return (
      <span className="inline-flex items-center rounded-full bg-surface-container-high px-1.5 py-px text-[10px] font-medium text-on-surface-variant">
        {tag}
      </span>
    );
  }

  if (timeAgo) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-on-surface-variant">
        <Clock className="h-2.5 w-2.5 opacity-70" aria-hidden />
        {timeAgo}
      </span>
    );
  }

  return null;
}

export function ArmazenagemDemandCard({
  id,
  origem,
  zona,
  priority,
  itemCount,
  storedCount,
  isPriority = false,
  timeAgo,
  tag,
  onStart,
  className,
  ...props
}: ArmazenagemDemandCardProps) {
  const isUrgente = priority === 'urgente';
  const percent = itemCount > 0 ? Math.round((storedCount / itemCount) * 100) : 0;
  const pending = Math.max(0, itemCount - storedCount);
  const meta = isPriority || tag || timeAgo;

  return (
    <button
      type="button"
      onClick={() => {
        hapticLight();
        onStart();
      }}
      className={cn(
        'group flex w-full flex-col gap-2.5 overflow-hidden rounded-lg border border-outline-variant bg-surface p-3 text-left shadow-sm',
        'touch-manipulation transition-all duration-150 active:scale-[0.98] active:bg-surface-container-low',
        isPriority && 'border-l-[3px] border-l-destructive bg-destructive/[0.03]',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
            isUrgente
              ? 'bg-secondary-container text-on-secondary-container group-active:bg-secondary-container/80'
              : 'bg-surface-container text-on-surface-variant group-active:bg-surface-container-high'
          )}
        >
          <PackagePlus className="h-4 w-4" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="truncate font-mono text-label-md font-bold text-primary">{id}</span>
            <span
              className={cn(
                'shrink-0 rounded-md px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide',
                isUrgente
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-surface-container-high text-on-surface-variant'
              )}
            >
              {PRIORITY_LABELS[priority]}
            </span>
          </div>

          <p className="flex min-w-0 items-center gap-1 truncate text-body-sm text-on-surface-variant">
            <Warehouse className="h-3 w-3 shrink-0 text-secondary" aria-hidden />
            <span className="truncate">
              <span className="font-medium text-on-surface">{origem}</span>
              <span className="mx-1 text-outline">·</span>
              {zona}
            </span>
          </p>

          {meta && (
            <div className="pt-0.5">
              <MetaChip isPriority={isPriority} tag={tag} timeAgo={timeAgo} />
            </div>
          )}
        </div>

        <ChevronRight
          className="h-4 w-4 shrink-0 text-outline transition-transform group-active:translate-x-0.5"
          aria-hidden
        />
      </div>

      <div className="space-y-1 pl-[46px]">
        <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
          <span>
            {storedCount} guardados · {pending} pendentes
          </span>
          <span className="font-mono font-semibold tabular-nums text-on-surface">{percent}%</span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso da demanda ${id}`}
        >
          <div
            className="h-full rounded-full bg-secondary transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </button>
  );
}
