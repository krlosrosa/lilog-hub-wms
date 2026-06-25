'use client';

import { useEffect, useState } from 'react';

import { Activity } from 'lucide-react';

import { cn } from '@lilog/ui';

export type DashboardTvHeaderProps = {
  unidadeNome?: string;
  dataReferencia: string;
  turnoLabel: string;
  className?: string;
};

export function DashboardTvHeader({
  unidadeNome,
  dataReferencia,
  turnoLabel,
  className,
}: DashboardTvHeaderProps) {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      setClock(
        new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header
      className={cn(
        'flex shrink-0 items-center justify-between gap-4 border-b border-white/10 pb-3',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Activity className="size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-white md:text-2xl">
            Dashboard Operacional
            {unidadeNome ? (
              <span className="text-white/45"> · {unidadeNome}</span>
            ) : null}
          </h1>
          <p className="text-[11px] text-white/40">
            {dataReferencia} · {turnoLabel}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
          Ao vivo
        </span>
        <p
          className="font-mono text-2xl font-bold tabular-nums text-white md:text-3xl"
          aria-live="polite"
        >
          {clock}
        </p>
      </div>
    </header>
  );
}
