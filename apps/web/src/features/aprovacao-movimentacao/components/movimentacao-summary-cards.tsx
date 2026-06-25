'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';
import { AlertTriangle, Cog, Package } from 'lucide-react';

import type { MovimentacaoSummary } from '@/features/aprovacao-movimentacao/types/aprovacao-movimentacao.schema';

const nf = new Intl.NumberFormat('pt-BR');

type MovimentacaoSummaryCardsProps = {
  summary: MovimentacaoSummary;
  className?: string;
};

function StatCardShell({
  children,
  accent = 'primary',
}: {
  children: ReactNode;
  accent?: 'primary' | 'tertiary' | 'destructive';
}) {
  const accentBg =
    accent === 'primary'
      ? 'bg-primary/5'
      : accent === 'tertiary'
        ? 'bg-tertiary/5'
        : 'bg-destructive/5';

  return (
    <div
      className={cn(
        'relative flex items-center gap-4 overflow-hidden rounded-xl border border-outline-variant',
        'bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass',
      )}
    >
      <div
        className={cn(
          'absolute -right-8 -top-8 size-24 rounded-bl-full transition-transform group-hover:scale-125',
          accentBg,
        )}
        aria-hidden
      />
      {children}
    </div>
  );
}

function IconBadge({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative z-10 flex size-12 shrink-0 items-center justify-center rounded-lg',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MovimentacaoSummaryCards({
  summary,
  className,
}: MovimentacaoSummaryCardsProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5', className)}>
      <StatCardShell accent="primary">
        <IconBadge className="bg-primary/10 text-primary">
          <Package className="size-8" aria-hidden />
        </IconBadge>
        <div className="relative z-10 min-w-0">
          <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
            Total Pendente
          </p>
          <h3 className="mt-1 text-headline-lg font-bold leading-none text-foreground">
            {nf.format(summary.totalPendente)}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              {summary.totalPendenteUnidade}
            </span>
          </h3>
        </div>
      </StatCardShell>

      <StatCardShell accent="tertiary">
        <IconBadge className="bg-tertiary/10 text-tertiary">
          <Cog className="size-8" aria-hidden />
        </IconBadge>
        <div className="relative z-10 min-w-0">
          <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
            Impacto Operacional
          </p>
          <h3 className="mt-1 text-headline-lg font-bold leading-none text-foreground">
            {summary.impactoOperacional.toLocaleString('pt-BR', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              {summary.impactoOperacionalUnidade}
            </span>
          </h3>
        </div>
      </StatCardShell>

      <StatCardShell accent="destructive">
        <IconBadge className="bg-destructive/10 text-destructive">
          <AlertTriangle className="size-8" aria-hidden />
        </IconBadge>
        <div className="relative z-10 min-w-0">
          <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
            Alertas Críticos
          </p>
          <h3 className="mt-1 text-headline-lg font-bold leading-none text-foreground">
            {String(summary.alertasCriticos).padStart(2, '0')}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              {summary.alertasCriticosLabel}
            </span>
          </h3>
        </div>
      </StatCardShell>
    </div>
  );
}
