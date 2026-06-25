import { cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  PackageSearch,
  RotateCcw,
  Search,
  Warehouse,
} from 'lucide-react';
import { useCallback } from 'react';

import { PullToRefresh } from '@/components/pull-to-refresh';
import { CountBadge } from '../components/quantidade-badge';
import { hapticLight, hapticMedium } from '@/lib/haptics';

import { RecuperacaoDemandCard } from '../components/recuperacao-demand-card';
import { RecuperacaoStatsStrip } from '../components/recuperacao-stats-strip';
import { useListaDemandaRecuperacao } from '../hooks/use-lista-demanda-recuperacao';
import type { RecuperacaoDemandaFilter } from '../types/recuperacao.schema';

function DemandCardSkeleton() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-outline-variant bg-surface p-3">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-surface-container" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-container" />
        <div className="h-3.5 w-full animate-pulse rounded bg-surface-container" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-surface-container" />
      </div>
      <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-surface-container" />
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => {
        hapticLight();
        onClick();
      }}
      className={cn(
        'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-label-sm transition-colors touch-manipulation active:scale-95',
        active
          ? 'bg-secondary text-on-secondary'
          : 'bg-surface-container text-on-surface-variant',
      )}
    >
      {label}
      <CountBadge count={count} active={active} />
    </button>
  );
}

export function ListaDemandaRecuperacaoView() {
  const { state, actions } = useListaDemandaRecuperacao();
  const {
    search,
    filter,
    filters,
    filteredDemands,
    counts,
    isEmpty,
    isLoading,
  } = state;

  const handleRefresh = useCallback(async () => {
    hapticMedium();
    await actions.refresh();
  }, [actions]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="page-enter flex flex-col pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
        <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
          <div className="flex h-14 items-center gap-3 px-margin-mobile">
            <Link
              to="/estoque"
              aria-label="Voltar ao estoque"
              onPointerDown={() => hapticLight()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
                Recuperação
              </h1>
              <p className="truncate font-mono text-label-sm text-on-surface-variant">
                Triagem de avarias
              </p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container">
              <Warehouse
                className="h-5 w-5 text-on-secondary-container"
                aria-hidden
              />
            </div>
          </div>

          <div className="space-y-3 px-margin-mobile pb-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => actions.setSearch(e.target.value)}
                placeholder="SKU ou ID da demanda"
                aria-label="Buscar demandas de recuperação"
                className="h-10 w-full rounded-full border border-outline-variant bg-surface-container py-2 pl-10 pr-4 text-body-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant focus:border-secondary focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div
              className="hide-scrollbar -mx-margin-mobile flex gap-2 overflow-x-auto px-margin-mobile pb-0.5"
              role="tablist"
              aria-label="Filtrar por status"
            >
              {filters.map((f) => (
                <FilterChip
                  key={f.id}
                  label={f.label}
                  count={counts[f.id as RecuperacaoDemandaFilter]}
                  active={filter === f.id}
                  onClick={() => actions.setFilter(f.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <RecuperacaoStatsStrip
          counts={counts}
          activeFilter={filter}
          onFilterChange={actions.setFilter}
        />

        <section className="space-y-2 px-margin-mobile pt-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <DemandCardSkeleton key={i} />
            ))
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container">
                <PackageSearch className="h-8 w-8 text-outline" aria-hidden />
              </div>
              <p className="text-headline-md font-semibold text-on-surface">
                Nenhuma demanda
              </p>
              <p className="max-w-xs text-body-sm text-on-surface-variant">
                {search
                  ? 'Ajuste a busca para ver outras demandas.'
                  : 'Não há demandas neste status no momento.'}
              </p>
            </div>
          ) : (
            filteredDemands.map((demanda) => (
              <RecuperacaoDemandCard
                key={demanda.id}
                demanda={demanda}
                onIniciar={() => actions.iniciarDemanda(demanda.id)}
                onVer={() => actions.verDemanda(demanda.id)}
              />
            ))
          )}
        </section>

        <p className="mx-margin-mobile mt-6 flex items-center justify-center gap-1.5 pb-2 text-center text-label-sm text-on-surface-variant/80">
          <RotateCcw className="h-3.5 w-3.5 text-secondary" aria-hidden />
          Puxe para baixo para atualizar
        </p>
      </div>
    </PullToRefresh>
  );
}
