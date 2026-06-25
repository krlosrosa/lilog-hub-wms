import { cn } from '@lilog/ui';
import { ChevronRight, Construction, Package } from 'lucide-react';
import type { KeyboardEvent } from 'react';

import { hapticLight } from '@/lib/haptics';

import type { RecuperacaoDemanda } from '../types/recuperacao.schema';
import { RecuperacaoPriorityBadge } from './recuperacao-priority-badge';

interface RecuperacaoDemandCardProps {
  demanda: RecuperacaoDemanda;
  onIniciar: () => void;
  onVer: () => void;
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

export function RecuperacaoDemandCard({
  demanda,
  onIniciar,
  onVer,
}: RecuperacaoDemandCardProps) {
  const isExecucao = demanda.status === 'em_execucao';
  const isFinalizada = demanda.status === 'finalizada';
  const isPendente = demanda.status === 'pendente';
  const isAlta = demanda.prioridade === 'alta';

  const primaryAction = isPendente ? onIniciar : onVer;

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
        'group flex items-center gap-2.5 overflow-hidden rounded-lg border border-outline-variant bg-surface p-3 shadow-sm',
        'transition-colors touch-manipulation active:bg-surface-container-low active:scale-[0.98]',
        isAlta && 'border-l-[3px] border-l-destructive bg-destructive/[0.03]',
        isFinalizada && 'opacity-85',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          isExecucao
            ? 'bg-secondary-container'
            : isFinalizada
              ? 'bg-surface-container-high'
              : 'bg-surface-container',
        )}
      >
        {isExecucao ? (
          <Construction
            className="h-4 w-4 text-on-secondary-container"
            aria-hidden
          />
        ) : (
          <Package
            className={cn(
              'h-4 w-4',
              isFinalizada ? 'text-outline' : 'text-secondary',
            )}
            aria-hidden
          />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="truncate font-mono text-label-md font-bold text-secondary">
            #{demanda.id}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <RecuperacaoPriorityBadge prioridade={demanda.prioridade} compact />
            <time
              dateTime={demanda.dataAbertura}
              className="font-mono text-[11px] font-medium tabular-nums text-on-surface-variant"
            >
              {demanda.dataAbertura}
            </time>
          </div>
        </div>

        <p className="line-clamp-1 text-body-sm font-semibold text-on-surface">
          {demanda.titulo}
        </p>

        <p className="line-clamp-1 text-[12px] text-on-surface-variant">
          {demanda.motivoAvaria}
        </p>

        {isExecucao && demanda.progressoPercent !== undefined ? (
          <div className="flex items-center gap-2 pt-0.5">
            <div
              className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container-highest"
              role="progressbar"
              aria-valuenow={demanda.progressoPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso ${demanda.progressoPercent}%`}
            >
              <div
                className="h-full rounded-full bg-secondary transition-all duration-500"
                style={{ width: `${demanda.progressoPercent}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-[10px] font-bold tabular-nums text-secondary">
              {demanda.progressoPercent}%
            </span>
            {demanda.operador && (
              <span className="max-w-[4.5rem] truncate text-[10px] text-on-surface-variant">
                {demanda.operador}
              </span>
            )}
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-1.5 pt-0.5 text-[11px] text-on-surface-variant">
            <span className="shrink-0 font-mono font-semibold tabular-nums text-on-surface">
              {demanda.quantidadeTotal} UN
            </span>
            <span className="shrink-0 rounded-full bg-surface-container-high px-1.5 py-px font-mono text-[10px] font-semibold">
              {demanda.totalSkus} SKUs
            </span>
          </div>
        )}
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-outline transition-transform group-active:translate-x-0.5"
        aria-hidden
      />
    </article>
  );
}
