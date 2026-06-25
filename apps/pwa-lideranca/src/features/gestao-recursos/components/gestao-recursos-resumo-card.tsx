'use client';

import { cn } from '@lilog/ui';
import { Coffee, TimerOff, Users, Zap } from 'lucide-react';

import type { KpiCard } from '@/features/gestao-recursos/types/gestao-recursos.schema';

type GestaoRecursosResumoCardProps = {
  kpis: KpiCard[];
  sessaoLabel: string;
  unidadeNome: string | null;
  lastUpdatedAt: Date | null;
};

function findKpi(kpis: KpiCard[], id: string): KpiCard | undefined {
  return kpis.find((kpi) => kpi.id === id);
}

function formatLastUpdate(date: Date | null): string {
  if (!date) {
    return '—';
  }

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function GestaoRecursosResumoCard({
  kpis,
  sessaoLabel,
  unidadeNome,
  lastUpdatedAt,
}: GestaoRecursosResumoCardProps) {
  const total = findKpi(kpis, 'total-operadores');
  const atuando = findKpi(kpis, 'atuando');
  const precisamPausa = findKpi(kpis, 'precisam-pausa');
  const ociosos = findKpi(kpis, 'ociosidade-critica');
  const emPausa = findKpi(kpis, 'em-pausa');

  const precisamCount = Number.parseInt(precisamPausa?.value ?? '0', 10) || 0;

  const statItems: Array<{
    icon: typeof Zap;
    label: string;
    value: string;
    highlight?: boolean;
  }> = [
    { icon: Zap, label: 'Atuando', value: atuando?.value ?? '00' },
    {
      icon: Coffee,
      label: 'Pausa',
      value: precisamPausa?.value ?? '00',
      highlight: precisamCount > 0,
    },
    { icon: TimerOff, label: 'Ociosos', value: ociosos?.value ?? '00' },
    { icon: Users, label: 'Em pausa', value: emPausa?.value ?? '00' },
  ];

  return (
    <article className="relative overflow-hidden rounded-lg bg-primary-container px-3 py-2.5 text-on-primary-container">
      <div className="relative z-10 flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-on-primary-container/10">
          <Users className="h-4 w-4 text-on-secondary-container" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-label-sm font-semibold text-on-secondary-container">
            {total?.value ?? '0'} operadores
          </p>
          <p className="truncate text-[11px] text-on-primary-container/75">
            {unidadeNome ?? 'Unidade'} · {sessaoLabel}
          </p>
          <p className="text-[10px] text-on-primary-container/60">
            Atualizado às {formatLastUpdate(lastUpdatedAt)}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-2.5 flex items-center justify-between gap-1">
        {statItems.map(({ icon: Icon, label, value, highlight }) => (
          <div
            key={label}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5"
          >
            <span className="flex items-center gap-0.5 text-[9px] uppercase tracking-wide text-on-primary-container/60">
              <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden />
              {label}
            </span>
            <span
              className={cn(
                'font-mono text-label-md font-semibold tabular-nums leading-none',
                highlight && 'text-warning',
              )}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      <div
        className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-secondary opacity-15 blur-xl"
        aria-hidden
      />
    </article>
  );
}
