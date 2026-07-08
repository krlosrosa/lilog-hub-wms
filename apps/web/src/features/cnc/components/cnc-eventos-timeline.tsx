'use client';

import { cn } from '@lilog/ui';
import {
  Check,
  Circle,
  FileText,
  PlayCircle,
  XCircle,
} from 'lucide-react';

import type { CncEvento } from '@/features/cnc/types/cnc.schema';
import { CNC_EVENTO_LABELS } from '@/features/cnc/types/cnc.schema';
import { formatCncDate } from '@/features/cnc/lib/cnc-detalhe-utils';

type CncEventosTimelineProps = {
  eventos: CncEvento[];
};

function eventoIcon(tipo: string) {
  if (tipo.includes('CRIADA')) {
    return FileText;
  }

  if (tipo.includes('INICIADA')) {
    return PlayCircle;
  }

  if (tipo.includes('ENCERRADA') || tipo.includes('CONCLUIDA')) {
    return Check;
  }

  if (tipo.includes('CANCELADA')) {
    return XCircle;
  }

  return Circle;
}

function eventoTone(tipo: string) {
  if (tipo.includes('CANCELADA')) {
    return 'border-destructive/30 bg-destructive/10 text-destructive';
  }

  if (tipo.includes('ENCERRADA') || tipo.includes('CONCLUIDA')) {
    return 'border-tertiary/30 bg-tertiary/10 text-tertiary';
  }

  if (tipo.includes('INICIADA')) {
    return 'border-primary/30 bg-primary/10 text-primary';
  }

  return 'border-outline-variant bg-surface-low text-muted-foreground';
}

export function CncEventosTimeline({ eventos }: CncEventosTimelineProps) {
  if (eventos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-outline-variant px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhum evento registrado nesta CNC.
      </p>
    );
  }

  const ordenados = [...eventos].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="relative space-y-0">
      {ordenados.map((evento, index) => {
        const Icon = eventoIcon(evento.tipoEvento);
        const isLast = index === ordenados.length - 1;

        return (
          <div key={evento.id} className="relative flex gap-3 pb-6">
            {!isLast ? (
              <span
                className="absolute bottom-0 left-[15px] top-8 w-px bg-outline-variant"
                aria-hidden
              />
            ) : null}

            <div
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full border',
                eventoTone(evento.tipoEvento),
              )}
            >
              <Icon className="size-3.5" aria-hidden />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {CNC_EVENTO_LABELS[evento.tipoEvento] ?? evento.tipoEvento}
                </p>
                <time
                  dateTime={evento.createdAt}
                  className="text-[11px] text-muted-foreground"
                >
                  {formatCncDate(evento.createdAt)}
                </time>
              </div>

              {evento.descricao ? (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {evento.descricao}
                </p>
              ) : null}

              {evento.situacaoAnterior && evento.situacaoNova ? (
                <p className="mt-1 inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {evento.situacaoAnterior} → {evento.situacaoNova}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
