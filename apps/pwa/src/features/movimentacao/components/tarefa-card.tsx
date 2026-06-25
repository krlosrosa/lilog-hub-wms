import { cn } from '@lilog/ui';
import { ArrowDown, ChevronRight, Clock, MapPin, Package, Zap } from 'lucide-react';
import type { HTMLAttributes } from 'react';

import { hapticLight } from '@/lib/haptics';

import type { Prioridade, Tarefa } from '../types/movimentacao.schema';

import { PriorityBadge } from './priority-badge';

const PRIORIDADE_ICON: Record<Prioridade, typeof Zap> = {
  alta: Zap,
  media: Package,
  baixa: ArrowDown,
};

const PRIORIDADE_ACCENT: Record<Prioridade, string> = {
  alta: 'border-l-destructive bg-destructive/[0.03]',
  media: 'border-l-warning bg-warning/[0.03]',
  baixa: 'border-l-secondary',
};

const PRIORIDADE_ICON_BOX: Record<Prioridade, string> = {
  alta: 'bg-destructive/10 text-destructive',
  media: 'bg-warning-container text-on-warning-container',
  baixa: 'bg-secondary-container text-on-secondary-container',
};

interface TarefaCardProps extends HTMLAttributes<HTMLButtonElement> {
  tarefa: Tarefa;
  onIniciar: (id: string) => void;
  showReserve?: boolean;
}

export function TarefaCard({
  tarefa,
  onIniciar,
  showReserve = false,
  className,
  ...props
}: TarefaCardProps) {
  const footerText = tarefa.timeLeft ?? tarefa.footerLabel;
  const PrioridadeIcon = PRIORIDADE_ICON[tarefa.prioridade];

  if (showReserve) {
    return (
      <article
        className={cn(
          'flex items-center gap-2.5 rounded-lg border border-outline-variant bg-surface p-3 opacity-60',
          className
        )}
      >
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            PRIORIDADE_ICON_BOX[tarefa.prioridade]
          )}
        >
          <PrioridadeIcon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-label-md font-bold text-primary">{tarefa.taskId}</p>
          <p className="truncate text-body-sm text-on-surface-variant">{tarefa.origem}</p>
        </div>
        <span className="shrink-0 rounded-lg border border-outline-variant px-3 py-1.5 text-label-sm text-on-surface-variant">
          Reservar
        </span>
      </article>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        hapticLight();
        onIniciar(tarefa.id);
      }}
      className={cn(
        'group flex w-full items-center gap-2.5 overflow-hidden rounded-lg border border-outline-variant bg-surface p-3 text-left shadow-sm',
        'touch-manipulation transition-all duration-150 active:scale-[0.98] active:bg-surface-container-low',
        'border-l-[3px]',
        PRIORIDADE_ACCENT[tarefa.prioridade],
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
          PRIORIDADE_ICON_BOX[tarefa.prioridade]
        )}
      >
        <PrioridadeIcon className="h-4 w-4" aria-hidden />
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="truncate font-mono text-label-md font-bold text-primary">
            {tarefa.taskId}
          </span>
          <span className="shrink-0 rounded-md bg-secondary-container px-1.5 py-px font-mono text-label-sm font-bold tabular-nums text-on-secondary-container">
            {String(tarefa.qty).padStart(2, '0')}
          </span>
        </div>

        <p className="flex min-w-0 items-center gap-1 truncate text-body-sm text-on-surface-variant">
          <MapPin className="h-3 w-3 shrink-0 text-secondary" aria-hidden />
          <span className="truncate">
            <span className="font-medium text-on-surface">{tarefa.origem}</span>
            <span className="mx-1 text-outline">·</span>
            {tarefa.item}
          </span>
        </p>

        <div className="flex min-w-0 items-center gap-1.5 pt-0.5">
          <PriorityBadge prioridade={tarefa.prioridade} />
          {footerText && (
            <span className="inline-flex min-w-0 items-center gap-0.5 truncate text-[10px] text-on-surface-variant">
              {tarefa.timeLeft && <Clock className="h-2.5 w-2.5 shrink-0 opacity-70" aria-hidden />}
              <span className="truncate">{footerText}</span>
            </span>
          )}
        </div>
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-outline transition-transform group-active:translate-x-0.5"
        aria-hidden
      />
    </button>
  );
}
