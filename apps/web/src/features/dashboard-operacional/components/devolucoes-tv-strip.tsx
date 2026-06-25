'use client';

import { cn } from '@lilog/ui';

import type {
  DevolucaoRecente,
  MotivoDevolucao,
} from '@/features/dashboard-operacional/types/dashboard-operacional.schema';
import { MOTIVO_DEVOLUCAO_LABELS } from '@/features/dashboard-operacional/types/dashboard-operacional.schema';

const motivoColors: Record<MotivoDevolucao, string> = {
  ausente: 'text-amber-300 bg-amber-500/15',
  recusa: 'text-red-300 bg-red-500/15',
  endereco: 'text-sky-300 bg-sky-500/15',
  avaria: 'text-orange-300 bg-orange-500/15',
  outro: 'text-white/60 bg-white/10',
};

const panelClassName =
  'rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md';

export type DevolucoesTvStripProps = {
  devolucoes: DevolucaoRecente[];
  className?: string;
};

export function DevolucoesTvStrip({
  devolucoes,
  className,
}: DevolucoesTvStripProps) {
  return (
    <section
      className={cn(panelClassName, 'overflow-hidden', className)}
      aria-label="Devoluções recentes"
    >
      <header className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-bold uppercase tracking-widest text-white/90">
          Devoluções Recentes
        </h2>
      </header>

      <div className="overflow-hidden">
        <ul className="flex animate-dashboard-marquee gap-4 py-4">
          {devolucoes.map((dev) => (
            <li
              key={dev.id}
              className="flex shrink-0 items-center gap-4 rounded-xl border border-white/10 bg-black/30 px-5 py-3"
            >
              <span className="font-mono text-lg font-bold tabular-nums text-white">
                {dev.nf}
              </span>
              <span
                className={cn(
                  'rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wide',
                  motivoColors[dev.motivo],
                )}
              >
                {MOTIVO_DEVOLUCAO_LABELS[dev.motivo]}
              </span>
              <span className="max-w-[200px] truncate text-sm text-white/70">
                {dev.cliente}
              </span>
              <span className="text-sm text-white/40">{dev.rota}</span>
              <span className="font-mono text-sm text-white/50">{dev.hora}</span>
            </li>
          ))}
          {/* duplicate for seamless marquee */}
          {devolucoes.map((dev) => (
            <li
              key={`${dev.id}-dup`}
              className="flex shrink-0 items-center gap-4 rounded-xl border border-white/10 bg-black/30 px-5 py-3"
              aria-hidden
            >
              <span className="font-mono text-lg font-bold tabular-nums text-white">
                {dev.nf}
              </span>
              <span
                className={cn(
                  'rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wide',
                  motivoColors[dev.motivo],
                )}
              >
                {MOTIVO_DEVOLUCAO_LABELS[dev.motivo]}
              </span>
              <span className="max-w-[200px] truncate text-sm text-white/70">
                {dev.cliente}
              </span>
              <span className="text-sm text-white/40">{dev.rota}</span>
              <span className="font-mono text-sm text-white/50">{dev.hora}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
