'use client';

import { BookOpen, Power, Star, Timer } from 'lucide-react';

import type { RegrasProdutividadeStats } from '@/features/config-operacional/types/regra-produtividade-base.schema';

type RegrasProdutividadeStatsCardsProps = {
  stats: RegrasProdutividadeStats;
  metaLabel?: string;
};

export function RegrasProdutividadeStatsCards({
  stats,
  metaLabel = 'Meta de tempo por mapa',
}: RegrasProdutividadeStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      <div className="rounded-xl border border-outline-variant bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-caption font-medium text-muted-foreground">
            Total de regras
          </span>
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="size-4" aria-hidden />
          </span>
        </div>
        <p className="text-headline-md font-semibold text-foreground">{stats.total}</p>
      </div>

      <div className="rounded-xl border border-outline-variant bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-caption font-medium text-muted-foreground">Ativas</span>
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Power className="size-4" aria-hidden />
          </span>
        </div>
        <p className="text-headline-md font-semibold text-foreground">{stats.ativas}</p>
      </div>

      <div className="col-span-2 rounded-xl border border-outline-variant bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass md:col-span-1">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-caption font-medium text-muted-foreground">
            Perfil padrão
          </span>
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary/20 text-secondary-foreground">
            <Star className="size-4" aria-hidden />
          </span>
        </div>
        <p className="truncate text-sm font-semibold text-foreground">
          {stats.perfilPadrao ?? '—'}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          <Timer className="size-3" aria-hidden />
          {metaLabel}
        </p>
      </div>
    </div>
  );
}
