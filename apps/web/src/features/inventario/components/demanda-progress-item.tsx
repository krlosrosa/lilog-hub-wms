'use client';

import { EyeOff, ShieldCheck } from 'lucide-react';

import { cn } from '@lilog/ui';

import {
  DEMANDA_PROGRESSO_STATUS_LABELS,
  type DemandaProgressoItem,
} from '@/features/inventario/types/inventario-detalhe.schema';
import { DEMANDA_PRIORIDADE_LABELS } from '@/features/inventario/types/inventario-lista.schema';

export type DemandaProgressItemProps = {
  demanda: DemandaProgressoItem;
};

const STATUS_TONE = {
  aguardando_inicio: {
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
    bar: 'bg-muted-foreground',
  },
  em_andamento: {
    dot: 'bg-primary animate-pulse',
    text: 'text-primary',
    bar: 'bg-primary',
  },
  concluida: {
    dot: 'bg-accent',
    text: 'text-accent',
    bar: 'bg-accent',
  },
  cancelada: {
    dot: 'bg-destructive/70',
    text: 'text-destructive',
    bar: 'bg-destructive/70',
  },
} as const;

export function DemandaProgressItem({ demanda }: DemandaProgressItemProps) {
  const tone = STATUS_TONE[demanda.status];
  const TipoIcon = demanda.tipo === 'cega' ? EyeOff : ShieldCheck;
  const prioridadeAlta =
    demanda.prioridade === 'alta' || demanda.prioridade === 'critica';

  return (
    <div
      className={cn(
        'rounded-md px-1.5 py-2 transition-colors hover:bg-surface-highest/40',
        !demanda.ativo && 'opacity-60',
      )}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-md',
              demanda.tipo === 'cega'
                ? 'bg-primary/10 text-primary'
                : 'bg-secondary/15 text-secondary-foreground',
            )}
          >
            <TipoIcon className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-foreground">
              {demanda.nome}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="truncate text-[10px] text-muted-foreground">
                {demanda.responsavelNome}
              </span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {demanda.tipo === 'cega' ? 'Cega' : 'Validação'}
              </span>
              {prioridadeAlta ? (
                <>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="rounded-full bg-destructive/10 px-1.5 py-px text-[9px] font-semibold text-destructive">
                    {DEMANDA_PRIORIDADE_LABELS[demanda.prioridade]}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className={cn('text-[11px] font-bold tabular-nums', tone.text)}>
            {demanda.progressPercent}%
          </p>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[9px] font-semibold',
              tone.text,
            )}
          >
            <span className={cn('size-1.5 rounded-full', tone.dot)} />
            {DEMANDA_PROGRESSO_STATUS_LABELS[demanda.status]}
          </span>
        </div>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-highest">
        <div
          className={cn('h-full rounded-full transition-all', tone.bar)}
          style={{ width: `${String(demanda.progressPercent)}%` }}
        />
      </div>

      <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">
        {demanda.enderecosConferidos}/{demanda.totalEnderecos} endereços
        conferidos
      </p>
    </div>
  );
}
