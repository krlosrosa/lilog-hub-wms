import { cn } from '@lilog/ui';
import {
  AlertCircle,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  Clock,
  MapPin,
} from 'lucide-react';
import type { HTMLAttributes } from 'react';

import { hapticLight } from '@/lib/haptics';

import type { InventoryDemandType } from '../types/estoque.schema';

const TYPE_LABELS: Record<InventoryDemandType, string> = {
  cega: 'Cega',
  validacao: 'Validação',
};

const TYPE_ICONS: Record<InventoryDemandType, typeof ClipboardList> = {
  cega: ClipboardList,
  validacao: CheckSquare,
};

interface InventoryDemandCardProps extends HTMLAttributes<HTMLButtonElement> {
  id: string;
  type: InventoryDemandType;
  zone: string;
  aisle: string;
  isPriority?: boolean;
  assignedUserAvatar?: string;
  timeAgo?: string;
  tag?: string;
  onStart: () => void;
}

function MetaChip({
  isPriority,
  tag,
  timeAgo,
  assignedUserAvatar,
}: Pick<
  InventoryDemandCardProps,
  'isPriority' | 'tag' | 'timeAgo' | 'assignedUserAvatar'
>) {
  if (isPriority) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-1.5 py-px text-[10px] font-medium text-destructive">
        <AlertCircle className="h-2.5 w-2.5 shrink-0" aria-hidden />
        Prioridade
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

  if (assignedUserAvatar) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant">
        <span className="flex h-4 w-4 overflow-hidden rounded-full border border-outline-variant">
          <img src={assignedUserAvatar} alt="" className="h-full w-full object-cover" />
        </span>
        Atribuída
      </span>
    );
  }

  return null;
}

export function InventoryDemandCard({
  id,
  type,
  zone,
  aisle,
  isPriority = false,
  assignedUserAvatar,
  timeAgo,
  tag,
  onStart,
  className,
  ...props
}: InventoryDemandCardProps) {
  const typeLabel = TYPE_LABELS[type];
  const isCega = type === 'cega';
  const TypeIcon = TYPE_ICONS[type];
  const meta = isPriority || tag || timeAgo || assignedUserAvatar;

  return (
    <button
      type="button"
      onClick={() => {
        hapticLight();
        onStart();
      }}
      className={cn(
        'group flex w-full items-center gap-2.5 overflow-hidden rounded-lg border border-outline-variant bg-surface p-3 text-left shadow-sm',
        'touch-manipulation transition-all duration-150 active:scale-[0.98] active:bg-surface-container-low',
        isPriority && 'border-l-[3px] border-l-destructive bg-destructive/[0.03]',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
          isCega
            ? 'bg-secondary-container text-on-secondary-container group-active:bg-secondary-container/80'
            : 'bg-tertiary-container/60 text-on-tertiary-container group-active:bg-tertiary-container/40'
        )}
      >
        <TypeIcon className="h-4 w-4" aria-hidden />
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="truncate font-mono text-label-md font-bold text-primary">{id}</span>
          <span
            className={cn(
              'shrink-0 rounded-md px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide',
              isCega
                ? 'bg-secondary-container/60 text-on-secondary-container'
                : 'bg-tertiary-container/50 text-on-tertiary-container'
            )}
          >
            {typeLabel}
          </span>
        </div>

        <p className="flex min-w-0 items-center gap-1 truncate text-body-sm text-on-surface-variant">
          <MapPin className="h-3 w-3 shrink-0 text-secondary" aria-hidden />
          <span className="truncate">
            <span className="font-medium text-on-surface">{zone}</span>
            <span className="mx-1 text-outline">·</span>
            {aisle}
          </span>
        </p>

        {meta && (
          <div className="pt-0.5">
            <MetaChip
              isPriority={isPriority}
              tag={tag}
              timeAgo={timeAgo}
              assignedUserAvatar={assignedUserAvatar}
            />
          </div>
        )}
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-outline transition-transform group-active:translate-x-0.5"
        aria-hidden
      />
    </button>
  );
}
