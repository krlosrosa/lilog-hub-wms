'use client';

import { BarChart3 } from 'lucide-react';

import type { TurnoUtilizacao } from '@/features/docas/types/docas.schema';

type DocaUtilizacaoChartProps = {
  turnos: TurnoUtilizacao[];
};

export function DocaUtilizacaoChart({ turnos }: DocaUtilizacaoChartProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-outline-variant bg-glass-bg p-3 shadow-inner-glow backdrop-blur-glass">
      <div className="relative z-10">
        <h4 className="text-xs font-semibold text-foreground">
          Utilização por turno
        </h4>
        <p className="mb-2 text-[10px] text-muted-foreground">
          Ocupação média — últimas 24h
        </p>
        <div className="flex h-20 items-end gap-1.5">
          {turnos.map((turno) => (
            <div
              key={turno.turno}
              className="min-w-0 flex-1 cursor-help rounded-sm bg-primary/25 transition-colors hover:bg-primary/45"
              style={{ height: `${turno.percentual}%` }}
              title={`Turno ${turno.turno}: ${turno.percentual}%`}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between gap-1">
          {turnos.map((turno) => (
            <span
              key={turno.turno}
              className="flex-1 truncate text-center text-[8px] text-muted-foreground"
            >
              T{turno.turno}
            </span>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-6 -right-6 opacity-[0.04]">
        <BarChart3 className="size-20 text-foreground" aria-hidden />
      </div>
    </div>
  );
}
