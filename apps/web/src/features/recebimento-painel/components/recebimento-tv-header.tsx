'use client';

import { useEffect, useState } from 'react';

import { PackageCheck } from 'lucide-react';

import { cn } from '@lilog/ui';

export type RecebimentoTvHeaderProps = {
  unidadeNome?: string;
  dataReferencia: string;
  turnoLabel: string;
  className?: string;
};

export function RecebimentoTvHeader({
  unidadeNome,
  dataReferencia,
  turnoLabel,
  className,
}: RecebimentoTvHeaderProps) {
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
        'flex shrink-0 items-center justify-between gap-4 border-b border-white/10 pb-2',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <PackageCheck className="size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-white xl:text-xl">
            Painel Recebimento
            {unidadeNome ? (
              <span className="text-white/45"> · {unidadeNome}</span>
            ) : null}
          </h1>
          <p className="text-[10px] text-white/40">
            {dataReferencia} · {turnoLabel}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-400 sm:flex">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
          Ao vivo
        </span>
        <p
          className="font-mono text-xl font-bold tabular-nums text-white xl:text-2xl"
          aria-live="polite"
        >
          {clock}
        </p>
      </div>
    </header>
  );
}
