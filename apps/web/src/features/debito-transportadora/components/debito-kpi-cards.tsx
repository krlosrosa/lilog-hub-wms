import { cn } from '@lilog/ui';
import {
  Gavel,
  TrendingDown,
  Verified,
} from 'lucide-react';

import type { DebitoKpi } from '@/features/debito-transportadora/types/debito.schema';

type DebitoKpiCardsProps = {
  kpi: DebitoKpi;
  isLoading?: boolean;
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatCurrencyCompact(value: number) {
  if (value >= 1_000) {
    return `R$ ${Math.round(value / 1_000)}k`;
  }

  return formatCurrency(value);
}

export function DebitoKpiCards({ kpi, isLoading = false }: DebitoKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      <article className="relative overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-lg bg-destructive/20 p-2 text-destructive">
            <TrendingDown className="size-5" aria-hidden />
          </div>
          {!isLoading && kpi.prejuizoVariacaoPercentual > 0 ? (
            <span className="rounded bg-destructive/10 px-2 py-0.5 text-caption text-destructive">
              +{kpi.prejuizoVariacaoPercentual}% este mês
            </span>
          ) : null}
        </div>
        <p className="text-label-md text-muted-foreground">
          Prejuízo Total em Aberto
        </p>
        <h3 className="mt-1 text-headline-md font-bold text-foreground">
          {formatCurrency(kpi.prejuizoTotalAberto)}
        </h3>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-destructive/40 to-transparent" />
      </article>

      <article className="relative overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-lg bg-secondary-container/20 p-2 text-secondary">
            <Gavel className="size-5" aria-hidden />
          </div>
          <span className="text-caption text-muted-foreground">
            {kpi.casosAtivosDisputa} casos ativos
          </span>
        </div>
        <p className="text-label-md text-muted-foreground">
          Cobranças em Disputa
        </p>
        <h3 className="mt-1 text-headline-md font-bold text-foreground">
          {formatCurrency(kpi.cobrancasEmDisputa)}
        </h3>
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-highest">
          <div
            className="h-full bg-secondary"
            style={{
              width:
                kpi.prejuizoTotalAberto > 0
                  ? `${Math.min(100, (kpi.cobrancasEmDisputa / kpi.prejuizoTotalAberto) * 100)}%`
                  : '0%',
            }}
          />
        </div>
      </article>

      <article className="relative overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-lg bg-tertiary-container/20 p-2 text-tertiary">
            <Verified className="size-5" aria-hidden />
          </div>
          <span className="text-caption text-tertiary">
            Meta {kpi.metaRecuperacao}%
          </span>
        </div>
        <p className="text-label-md text-muted-foreground">Taxa de Recuperação</p>
        <h3 className="mt-1 text-headline-md font-bold text-foreground">
          {kpi.taxaRecuperacao}%
        </h3>
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-highest">
          <div
            className={cn('h-full bg-tertiary shadow-[0_0_15px_hsl(var(--tertiary)/0.15)]')}
            style={{ width: `${kpi.taxaRecuperacao}%` }}
          />
        </div>
      </article>

      <article className="rounded-xl border border-outline-variant/50 bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
        <p className="mb-3 text-label-md text-muted-foreground">
          Top 3 Transportadoras Ofensoras
        </p>
        <div className="space-y-3">
          {kpi.topOfensores.length > 0 ? (
            kpi.topOfensores.map((ofensor) => (
              <div key={ofensor.nome}>
                <div className="flex items-center justify-between text-caption">
                  <span className="text-foreground">{ofensor.nome}</span>
                  <span className="text-destructive">
                    {formatCurrencyCompact(ofensor.valor)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-highest">
                  <div
                    className="h-full bg-destructive/60"
                    style={{ width: `${ofensor.percentualBarra}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-caption text-muted-foreground">
              Nenhum processo registrado ainda.
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
