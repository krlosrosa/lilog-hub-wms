'use client';

import { Button, cn } from '@lilog/ui';
import { Calendar } from 'lucide-react';

import {
  AGENDA_DIA_HOJE,
  CALENDAR_WEEKDAYS,
} from '@/features/frota/mocks/frota-mock-data';
import {
  AGENDA_EVENTO_TIPO_LABELS,
  type AgendaEvento,
  type AgendaEventoTipo,
  type AgendaPeriodo,
} from '@/features/frota/types/frota.schema';

type AgendaCalendarioProps = {
  eventos: AgendaEvento[];
  periodo: AgendaPeriodo;
  onPeriodoChange: (periodo: AgendaPeriodo) => void;
};

const EVENTO_CHIP_CLASS: Record<AgendaEventoTipo, string> = {
  quebra:
    'border-destructive/30 bg-destructive/20 text-destructive [&_.dot]:bg-destructive',
  oleo: 'border-primary/30 bg-primary/15 text-primary [&_.dot]:bg-primary',
  licenca:
    'border-secondary/30 bg-secondary/20 text-secondary-foreground [&_.dot]:bg-secondary',
  freios: 'border-primary/30 bg-primary/15 text-primary [&_.dot]:bg-primary',
  inspecao:
    'border-tertiary/30 bg-tertiary/15 text-tertiary-foreground [&_.dot]:bg-tertiary',
  pneus: 'border-primary/30 bg-primary/15 text-primary [&_.dot]:bg-primary',
};

/** Dias exibidos no mock do calendário mensal (duas semanas parciais). */
const CALENDAR_DAYS = [
  { dia: 12, muted: false },
  { dia: 13, muted: true },
  { dia: 14, muted: false },
  { dia: 15, muted: false },
  { dia: 16, muted: false, hoje: true },
  { dia: 17, muted: false },
  { dia: 18, muted: false },
  { dia: 19, muted: false },
  { dia: 20, muted: false },
  { dia: 21, muted: false },
  { dia: 22, muted: false },
  { dia: 23, muted: false },
  { dia: 24, muted: false },
  { dia: 25, muted: false },
] as const;

function EventoChip({ evento }: { evento: AgendaEvento }) {
  const label =
    evento.count != null
      ? `${AGENDA_EVENTO_TIPO_LABELS[evento.tipo]} (${evento.count})`
      : AGENDA_EVENTO_TIPO_LABELS[evento.tipo];

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded border px-1 py-0.5 font-mono text-[9px] leading-tight',
        EVENTO_CHIP_CLASS[evento.tipo],
      )}
    >
      <span className="dot h-1.5 w-1.5 shrink-0 rounded-full" />
      {label}
    </div>
  );
}

export function AgendaCalendario({
  eventos,
  periodo,
  onPeriodoChange,
}: AgendaCalendarioProps) {
  const eventosPorDia = eventos.reduce<Record<number, AgendaEvento[]>>(
    (acc, ev) => {
      const list = acc[ev.dia] ?? [];
      list.push(ev);
      acc[ev.dia] = list;
      return acc;
    },
    {},
  );

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-title-md font-medium text-foreground">
          <Calendar className="h-5 w-5 text-primary" aria-hidden />
          Agenda de manutenção
        </h2>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={periodo === 'semana' ? 'default' : 'outline'}
            className="text-label-sm uppercase"
            onClick={() => onPeriodoChange('semana')}
          >
            Semana
          </Button>
          <Button
            type="button"
            size="sm"
            variant={periodo === 'mes' ? 'default' : 'outline'}
            className="text-label-sm uppercase"
            onClick={() => onPeriodoChange('mes')}
          >
            Mês
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-card">
        <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low">
          {CALENDAR_WEEKDAYS.map((wd, i) => (
            <div
              key={wd}
              className={cn(
                'border-r border-outline-variant p-3 text-center text-label-sm font-medium last:border-r-0',
                i >= 5 ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {wd}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[minmax(100px,140px)]">
          {CALENDAR_DAYS.map((cell) => {
            const dayEvents = eventosPorDia[cell.dia] ?? [];
            const isHoje =
              ('hoje' in cell && cell.hoje) || cell.dia === AGENDA_DIA_HOJE;

            return (
              <div
                key={cell.dia}
                className={cn(
                  'relative border-b border-r border-outline-variant p-2 transition-colors last:border-r-0',
                  cell.muted && 'bg-surface-container-low/50',
                  isHoje &&
                    'z-10 bg-surface-container-high ring-2 ring-primary ring-inset',
                  !cell.muted &&
                    !isHoje &&
                    'hover:bg-surface-container-high',
                )}
              >
                <span
                  className={cn(
                    'font-mono text-[10px]',
                    cell.muted && 'opacity-30 text-muted-foreground',
                    isHoje && 'font-bold text-primary',
                    !cell.muted && !isHoje && 'text-muted-foreground',
                  )}
                >
                  {isHoje ? `${cell.dia} HOJE` : cell.dia}
                </span>
                <div className="mt-2 space-y-1">
                  {dayEvents.map((ev) => (
                    <EventoChip key={ev.id} evento={ev} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
