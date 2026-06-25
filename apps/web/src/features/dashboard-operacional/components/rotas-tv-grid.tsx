'use client';

import { cn } from '@lilog/ui';

import type {
  RotaDashboard,
  RotaStatus,
} from '@/features/dashboard-operacional/types/dashboard-operacional.schema';
import { ROTA_STATUS_LABELS } from '@/features/dashboard-operacional/types/dashboard-operacional.schema';

const panelClassName =
  'rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md';

const statusStyles: Record<
  RotaStatus,
  { badge: string; bar: string; glow?: string }
> = {
  em_viagem: {
    badge: 'bg-sky-500/20 text-sky-300 ring-sky-500/30',
    bar: 'bg-sky-400',
  },
  entregue: {
    badge: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30',
    bar: 'bg-emerald-400',
  },
  parcial: {
    badge: 'bg-amber-500/20 text-amber-300 ring-amber-500/30',
    bar: 'bg-amber-400',
  },
  atrasado: {
    badge: 'bg-red-500/20 text-red-300 ring-red-500/30',
    bar: 'bg-red-400',
    glow: 'shadow-[0_0_20px_hsl(0_72%_51%/0.25)]',
  },
  aguardando: {
    badge: 'bg-white/10 text-white/50 ring-white/20',
    bar: 'bg-white/30',
  },
};

export type RotasTvGridProps = {
  rotas: RotaDashboard[];
  className?: string;
  maxItems?: number;
};

export function RotasTvGrid({
  rotas,
  className,
  maxItems = 8,
}: RotasTvGridProps) {
  const visible = rotas.slice(0, maxItems);

  return (
    <section
      className={cn(panelClassName, 'overflow-hidden', className)}
      aria-label="Rotas em operação"
    >
      <header className="border-b border-white/10 px-5 py-4 md:px-6">
        <h2 className="text-lg font-bold uppercase tracking-widest text-white/90">
          Rotas em Operação
        </h2>
        <p className="mt-1 text-sm text-white/40">
          {rotas.length} largadas · entregas e devoluções ao vivo
        </p>
      </header>

      <div className="grid gap-3 p-4 sm:grid-cols-2 md:p-5 lg:grid-cols-2 xl:grid-cols-4">
        {visible.map((rota) => {
          const pct =
            rota.totalNfs > 0
              ? Math.round((rota.entregues / rota.totalNfs) * 100)
              : 0;
          const styles = statusStyles[rota.status];

          return (
            <article
              key={rota.id}
              className={cn(
                'rounded-xl border border-white/10 bg-black/25 p-4',
                rota.status === 'atrasado' && styles.glow,
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-white">
                    {rota.rota}
                  </p>
                  <p className="truncate text-xs text-white/45">
                    {rota.placa} · {rota.veiculo}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset',
                    styles.badge,
                  )}
                >
                  {ROTA_STATUS_LABELS[rota.status]}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">
                    NFs
                  </p>
                  <p className="text-xl font-bold tabular-nums text-white">
                    {rota.totalNfs}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-emerald-400/70">
                    Entregues
                  </p>
                  <p className="text-xl font-bold tabular-nums text-emerald-300">
                    {rota.entregues}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-400/70">
                    Devol.
                  </p>
                  <p className="text-xl font-bold tabular-nums text-amber-300">
                    {rota.devolucoes}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>Progresso</span>
                  <span className="tabular-nums">{pct}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      styles.bar,
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <p className="mt-3 text-right text-xs text-white/35">
                Retorno prev.{' '}
                <span className="font-mono font-semibold text-white/60">
                  {rota.previsaoRetorno}
                </span>
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
