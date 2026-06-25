import { cn } from '@lilog/ui';
import { AlertTriangle, ChevronRight, Info, Package } from 'lucide-react';
import type { KeyboardEvent } from 'react';

import { hapticLight } from '@/lib/haptics';

import type { RecuperacaoItem } from '../types/recuperacao.schema';

interface RecuperacaoItemCardProps {
  item: RecuperacaoItem;
  onIniciar: () => void;
  onInfo: () => void;
}

function handleCardKeyDown(
  event: KeyboardEvent<HTMLElement>,
  action: () => void,
) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
}

export function RecuperacaoItemCard({
  item,
  onIniciar,
  onInfo,
}: RecuperacaoItemCardProps) {
  const isConcluido = item.status === 'concluido';
  const isExecucao = item.status === 'em_execucao';
  const primaryAction = isConcluido ? onInfo : onIniciar;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => {
        hapticLight();
        primaryAction();
      }}
      onKeyDown={(e) => handleCardKeyDown(e, primaryAction)}
      className={cn(
        'group flex items-center gap-2 overflow-hidden rounded-lg border border-outline-variant bg-surface p-2.5 shadow-sm',
        'transition-colors touch-manipulation active:bg-surface-container-low active:scale-[0.98]',
        isConcluido && 'opacity-80',
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          isExecucao
            ? 'bg-secondary-container'
            : isConcluido
              ? 'bg-surface-container-high'
              : 'bg-surface-container',
        )}
      >
        <Package
          className={cn(
            'h-4 w-4',
            isExecucao
              ? 'text-on-secondary-container'
              : isConcluido
                ? 'text-outline'
                : 'text-secondary',
          )}
          aria-hidden
        />
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="truncate font-mono text-label-md font-bold text-secondary">
            {item.sku}
          </span>
          <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-on-surface">
            {String(item.quantidadeRecuperar).padStart(2, '0')} UN
          </span>
        </div>

        <p className="line-clamp-1 text-body-sm font-semibold text-on-surface">
          {item.nome}
        </p>

        <div className="flex min-w-0 items-center gap-1.5">
          <span className="inline-flex min-w-0 items-center gap-0.5 truncate text-[11px] font-medium text-destructive">
            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{item.motivoAvaria}</span>
          </span>
          {isConcluido && (
            <span className="shrink-0 rounded-full bg-secondary-container px-1.5 py-px text-[10px] font-semibold text-on-secondary-container">
              OK
            </span>
          )}
          {isExecucao && (
            <span className="shrink-0 rounded-full bg-warning-container px-1.5 py-px text-[10px] font-semibold text-on-warning-container">
              Exec.
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          hapticLight();
          onInfo();
        }}
        aria-label="Ver detalhes do item"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform touch-manipulation active:scale-90"
      >
        <Info className="h-4 w-4" aria-hidden />
      </button>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-outline transition-transform group-active:translate-x-0.5"
        aria-hidden
      />
    </article>
  );
}
