import { cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  AlertCircle,
  ArrowLeft,
  Layers,
  Loader2,
  PackagePlus,
  PackageSearch,
  RefreshCw,
  Search,
  Warehouse,
} from 'lucide-react';
import { useCallback } from 'react';

import { PullToRefresh } from '@/components/pull-to-refresh';
import { hapticLight, hapticMedium } from '@/lib/haptics';

import { ArmazenagemDemandCard } from '../components/armazenagem-demand-card';
import { useListaArmazenagem } from '../hooks/use-lista-armazenagem';
import type { ArmazenagemDemandaFilter } from '../types/armazenagem.schema';

const FILTERS: { id: ArmazenagemDemandaFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'urgente', label: 'Urgente' },
  { id: 'normal', label: 'Normal' },
];

function ArmazenagemDemandCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-outline-variant bg-surface p-3">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-surface-container" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex justify-between gap-2">
            <div className="h-4 w-32 animate-pulse rounded bg-surface-container" />
            <div className="h-4 w-12 animate-pulse rounded bg-surface-container" />
          </div>
          <div className="h-3.5 w-40 animate-pulse rounded bg-surface-container" />
        </div>
        <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-surface-container" />
      </div>
      <div className="space-y-1 pl-[46px]">
        <div className="h-3 w-28 animate-pulse rounded bg-surface-container" />
        <div className="h-1.5 w-full animate-pulse rounded-full bg-surface-container" />
      </div>
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
      onClick={() => {
        hapticLight();
        onClick();
      }}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-label-sm whitespace-nowrap transition-colors touch-manipulation active:scale-95',
        active
          ? 'bg-secondary text-on-secondary'
          : 'bg-surface-container text-on-surface-variant'
      )}
    >
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
          active
            ? 'bg-on-secondary/20 text-on-secondary'
            : 'bg-outline-variant/30 text-on-surface-variant'
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ArmazenagemResumoCard({
  activeCount,
  stats,
  counts,
}: {
  activeCount: number;
  stats: { totalItems: number; storedItems: number; pendingItems: number };
  counts: { all: number; urgente: number; normal: number; priority: number };
}) {
  const percent =
    stats.totalItems > 0
      ? Math.round((stats.storedItems / stats.totalItems) * 100)
      : 0;

  const statItems = [
    { icon: Warehouse, label: 'Urg.', value: counts.urgente },
    { icon: PackagePlus, label: 'Norm.', value: counts.normal },
    {
      icon: AlertCircle,
      label: 'Prior.',
      value: counts.priority,
      highlight: counts.priority > 0,
    },
  ] as const;

  return (
    <article className="relative overflow-hidden rounded-lg bg-primary-container px-3 py-2.5 text-on-primary-container">
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-on-primary-container/10">
          <PackagePlus className="h-4 w-4 text-on-secondary-container" aria-hidden />
        </div>

        <div className="min-w-0 shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-on-primary-container/65">
            Demandas ativas
          </p>
          <p className="font-mono text-headline-md font-bold tabular-nums leading-none">
            {activeCount}
          </p>
        </div>

        <div className="mx-0.5 h-8 w-px shrink-0 bg-on-primary-container/15" aria-hidden />

        <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
          {statItems.map(({ icon: Icon, label, value, highlight }) => (
            <div key={label} className="flex min-w-0 flex-col items-center gap-0.5 px-0.5">
              <span className="flex items-center gap-0.5 text-[9px] uppercase tracking-wide text-on-primary-container/60">
                <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden />
                {label}
              </span>
              <span
                className={cn(
                  'font-mono text-label-md font-semibold tabular-nums leading-none',
                  highlight && 'text-on-secondary-container'
                )}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-2 flex items-center gap-2">
        <div
          className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-on-primary-container/15"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Percentual de itens guardados"
        >
          <div
            className="h-full rounded-full bg-secondary-container transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[10px] font-semibold tabular-nums text-on-primary-container/75">
          {stats.storedItems}/{stats.totalItems} itens
        </span>
      </div>

      <div
        className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-secondary opacity-15 blur-xl"
        aria-hidden
      />
    </article>
  );
}

export function ListaArmazenagemView({
  backTo = '/movimentacao',
  detalhePath = '/movimentacao/armazenagem/$id',
  filterMode = 'all',
}: {
  backTo?: string;
  listaPath?: string;
  detalhePath?: string;
  filterMode?: 'all' | 'armazenagem' | 'ressuprimento';
} = {}) {
  const { state, actions } = useListaArmazenagem({ detalhePath, filterMode });
  const {
    search,
    filter,
    filteredDemandas,
    counts,
    stats,
    isEmpty,
    isLoading,
    isRefreshing,
    error,
  } = state;

  const handleRefresh = useCallback(async () => {
    hapticMedium();
    await actions.refresh();
  }, [actions]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="page-enter flex flex-col">
        <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
          <div className="flex h-14 items-center gap-3 px-margin-mobile">
            <Link
              to={backTo}
              aria-label="Voltar à movimentação"
              onPointerDown={() => hapticLight()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
                Armazenagem
              </h1>
              <p className="truncate font-mono text-label-sm text-on-surface-variant">
                {isLoading
                  ? 'Carregando demandas...'
                  : `${filteredDemandas.length} de ${counts.all} demandas`}
              </p>
            </div>
            <button
              type="button"
              disabled={isRefreshing}
              onClick={() => void handleRefresh()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation disabled:opacity-50"
              aria-label="Atualizar demandas"
            >
              {isRefreshing ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>

          <div className="space-y-2.5 px-margin-mobile pb-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => actions.setSearch(e.target.value)}
                placeholder="ID, origem ou zona..."
                aria-label="Buscar demandas"
                className="h-10 w-full rounded-full border border-outline-variant bg-surface-container py-2 pl-10 pr-4 text-body-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:border-secondary focus:ring-2 focus:ring-secondary"
              />
            </div>

            {!isLoading && (
              <div
                className="hide-scrollbar -mx-margin-mobile flex gap-2 overflow-x-auto px-margin-mobile"
                role="tablist"
                aria-label="Filtrar demandas"
              >
                {FILTERS.map((f) => (
                  <FilterChip
                    key={f.id}
                    label={f.label}
                    count={
                      f.id === 'all'
                        ? counts.all
                        : f.id === 'urgente'
                          ? counts.urgente
                          : counts.normal
                    }
                    active={filter === f.id}
                    onClick={() => actions.setFilter(f.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="flex flex-col gap-2 px-margin-mobile pb-[calc(24px+env(safe-area-inset-bottom,0px))] pt-3">
          {!isLoading && (
            <ArmazenagemResumoCard
              activeCount={stats.activeCount}
              stats={stats}
              counts={counts}
            />
          )}

          {!isLoading && !isEmpty && (
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
                <Layers className="h-4 w-4 text-secondary" aria-hidden />
                Demandas pendentes
              </h2>
              <span className="rounded-full bg-surface-container px-2.5 py-0.5 font-mono text-label-sm tabular-nums text-on-surface-variant">
                {filteredDemandas.length}
              </span>
            </div>
          )}

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <ArmazenagemDemandCardSkeleton key={i} />
            ))
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" aria-hidden />
              <p className="text-headline-md font-semibold text-on-surface">
                Falha ao carregar
              </p>
              <p className="max-w-xs text-body-sm text-on-surface-variant">{error}</p>
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-surface-container">
                <PackageSearch className="h-8 w-8 text-outline" aria-hidden />
              </div>
              <p className="text-headline-md font-semibold text-on-surface">
                Nenhuma demanda encontrada
              </p>
              <p className="max-w-xs text-body-sm text-on-surface-variant">
                {search || filter !== 'all'
                  ? 'Ajuste os filtros ou a busca para ver outras demandas.'
                  : 'Não há demandas de armazenagem pendentes no momento.'}
              </p>
            </div>
          ) : (
            filteredDemandas.map((demanda) => (
              <ArmazenagemDemandCard
                key={demanda.id}
                id={demanda.id}
                origem={demanda.origem}
                zona={demanda.zona}
                priority={demanda.priority}
                itemCount={demanda.itemCount}
                storedCount={demanda.storedCount}
                isPriority={demanda.isPriority}
                timeAgo={demanda.timeAgo}
                tag={demanda.tag}
                onStart={() => actions.iniciarDemanda(demanda.routeId)}
              />
            ))
          )}
        </section>
      </div>
    </PullToRefresh>
  );
}
