import { cn } from '@lilog/ui';
import {
  ChevronRight,
  Clock,
  MapPin,
  Package,
  Play,
  Scale,
  Zap,
} from 'lucide-react';
import type { HTMLAttributes } from 'react';

import { hapticLight } from '@/lib/haptics';

import type { Tarefa } from '../types/peso-variavel.schema';

const PRIORIDADE_LABELS: Record<Tarefa['prioridade'], string> = {
  alto_valor: 'Alto valor',
  padrao: 'Padrão',
  express: 'Express',
  despacho_imediato: 'Despacho imediato',
};

interface TarefaCardProps extends HTMLAttributes<HTMLButtonElement> {
  tarefa: Tarefa;
  onIniciar: (id: string) => void;
}

export function TarefaCard({ tarefa, onIniciar, className, ...props }: TarefaCardProps) {
  const isExpress =
    tarefa.status === 'express' || tarefa.prioridade === 'despacho_imediato';
  const isEmAndamento = tarefa.status === 'em_andamento' || tarefa.status === 'express';
  const isAltoValor = tarefa.prioridade === 'alto_valor';

  const CardIcon = isExpress ? Zap : isEmAndamento ? Play : isAltoValor ? Scale : Package;

  const accentClass = isExpress
    ? 'border-l-secondary bg-secondary/[0.03]'
    : isAltoValor
      ? 'border-l-destructive bg-destructive/[0.03]'
      : isEmAndamento
        ? 'border-l-secondary/70'
        : 'border-l-outline-variant';

  const iconBoxClass = isExpress
    ? 'bg-secondary-container text-on-secondary-container'
    : isAltoValor
      ? 'bg-destructive/10 text-destructive'
      : isEmAndamento
        ? 'bg-secondary-container/80 text-on-secondary-container'
        : 'bg-surface-container text-secondary';

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
        accentClass,
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
          iconBoxClass
        )}
      >
        <CardIcon className="h-4 w-4" aria-hidden />
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="truncate font-mono text-label-md font-bold text-primary">
            {tarefa.pedidoId}
          </span>
          <span className="shrink-0 rounded-md bg-secondary-container px-1.5 py-px font-mono text-label-sm font-bold tabular-nums text-on-secondary-container">
            {tarefa.totalSkus} SKUs
          </span>
        </div>

        <p className="flex min-w-0 items-center gap-1 truncate text-body-sm text-on-surface-variant">
          <MapPin className="h-3 w-3 shrink-0 text-secondary" aria-hidden />
          <span className="truncate">
            <span className="font-medium text-on-surface">{tarefa.zona}</span>
            {tarefa.pesoTotalKg != null && (
              <>
                <span className="mx-1 text-outline">·</span>
                {tarefa.pesoTotalKg} kg
              </>
            )}
          </span>
        </p>

        <div className="flex min-w-0 items-center gap-1.5 pt-0.5">
          {isExpress ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary-container px-1.5 py-px text-[10px] font-semibold uppercase text-on-secondary-container">
              <Zap className="h-2.5 w-2.5" aria-hidden />
              Express
            </span>
          ) : isEmAndamento ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary/10 px-1.5 py-px text-[10px] font-medium text-secondary">
              <Clock className="h-2.5 w-2.5" aria-hidden />
              Em andamento
            </span>
          ) : (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium',
                isAltoValor
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-surface-container-high text-on-surface-variant'
              )}
            >
              {PRIORIDADE_LABELS[tarefa.prioridade]}
            </span>
          )}

          <span className="truncate text-[10px] text-on-surface-variant">
            {isEmAndamento ? 'Retomar separação' : 'Iniciar separação'}
          </span>
        </div>
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-outline transition-transform group-active:translate-x-0.5"
        aria-hidden
      />
    </button>
  );
}
