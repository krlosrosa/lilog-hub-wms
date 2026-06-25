'use client';

import { cn } from '@lilog/ui';

import type { DevolucaoRecente } from '@/features/dashboard-operacional/types/dashboard-operacional.schema';
import { MOTIVO_DEVOLUCAO_LABELS } from '@/features/dashboard-operacional/types/dashboard-operacional.schema';

export function DevolucoesTvTicker({
  devolucoes,
  className,
}: {
  devolucoes: DevolucaoRecente[];
  className?: string;
}) {
  const items = devolucoes.slice(0, 6);

  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-md',
        className,
      )}
      aria-label="Últimas devoluções"
    >
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-amber-400/80">
        Devoluções
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <ul className="flex animate-dashboard-marquee gap-6">
          {items.map((dev) => (
            <li
              key={dev.id}
              className="flex shrink-0 items-center gap-2 text-[11px] text-white/60"
            >
              <span className="font-mono font-semibold text-white/90">
                {dev.nf}
              </span>
              <span className="text-amber-400/70">
                {MOTIVO_DEVOLUCAO_LABELS[dev.motivo]}
              </span>
              <span className="text-white/40">{dev.cliente}</span>
            </li>
          ))}
          {items.map((dev) => (
            <li
              key={`${dev.id}-dup`}
              className="flex shrink-0 items-center gap-2 text-[11px] text-white/60"
              aria-hidden
            >
              <span className="font-mono font-semibold text-white/90">
                {dev.nf}
              </span>
              <span className="text-amber-400/70">
                {MOTIVO_DEVOLUCAO_LABELS[dev.motivo]}
              </span>
              <span className="text-white/40">{dev.cliente}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
