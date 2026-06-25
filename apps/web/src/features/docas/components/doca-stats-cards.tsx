'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';
import {
  Ban,
  CheckCircle2,
  Clock,
  Grid3X3,
  RefreshCw,
  Wrench,
} from 'lucide-react';

import type { DocaStats } from '@/features/docas/types/docas.schema';

type DocaStatsCardsProps = DocaStats;

function StatCardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-outline-variant bg-glass-bg p-3 shadow-inner-glow backdrop-blur-glass">
      {children}
    </div>
  );
}

function ProgressBar({
  value,
  className,
}: {
  value: number;
  className: string;
}) {
  return (
    <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-surface-highest">
      <div
        className={cn('h-full rounded-full transition-all', className)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function DocaStatsCards({
  total,
  disponivel,
  ocupada,
  reservada,
  bloqueada,
  manutencao,
}: DocaStatsCardsProps) {
  const pctDisponivel = total > 0 ? (disponivel / total) * 100 : 0;
  const pctOcupada = total > 0 ? (ocupada / total) * 100 : 0;
  const pctReservada = total > 0 ? (reservada / total) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      <StatCardShell>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">
            Total
          </span>
          <Grid3X3 className="size-3.5 text-primary" aria-hidden />
        </div>
        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
          {total}
        </p>
      </StatCardShell>

      <StatCardShell>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">
            Disponíveis
          </span>
          <CheckCircle2 className="size-3.5 text-tertiary" aria-hidden />
        </div>
        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
          {String(disponivel).padStart(2, '0')}
        </p>
        <ProgressBar value={pctDisponivel} className="bg-tertiary" />
      </StatCardShell>

      <StatCardShell>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">
            Ocupadas
          </span>
          <RefreshCw className="size-3.5 text-secondary" aria-hidden />
        </div>
        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
          {String(ocupada).padStart(2, '0')}
        </p>
        <ProgressBar value={pctOcupada} className="bg-secondary" />
      </StatCardShell>

      <StatCardShell>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">
            Reservadas
          </span>
          <Clock className="size-3.5 text-primary" aria-hidden />
        </div>
        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
          {String(reservada).padStart(2, '0')}
        </p>
        <ProgressBar value={pctReservada} className="bg-primary" />
      </StatCardShell>

      <StatCardShell>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">
            Bloqueadas
          </span>
          <Ban className="size-3.5 text-destructive" aria-hidden />
        </div>
        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
          {String(bloqueada).padStart(2, '0')}
        </p>
      </StatCardShell>

      <StatCardShell>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">
            Manutenção
          </span>
          <Wrench className="size-3.5 text-muted-foreground" aria-hidden />
        </div>
        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
          {String(manutencao).padStart(2, '0')}
        </p>
      </StatCardShell>
    </div>
  );
}
