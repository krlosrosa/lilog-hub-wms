import { cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  Loader2,
  PackageSearch,
  RefreshCw,
  Search,
  Truck,
  Warehouse,
  Zap,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { PullToRefresh } from '@/components/pull-to-refresh';
import { hapticLight, hapticMedium } from '@/lib/haptics';

import { UnidadeSelector } from '@/features/unidade';

import { DemandCard } from '../components/demand-card';
import { useIniciarDemanda } from '../hooks/use-iniciar-demanda';
import { useListaDemanda } from '../hooks/use-lista-demanda';

type DemandFilter = 'all' | 'priority';

function DemandCardSkeleton() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-outline-variant bg-surface p-3">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-surface-container" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex justify-between gap-2">
          <div className="h-4 w-32 animate-pulse rounded bg-surface-container" />
          <div className="h-4 w-10 animate-pulse rounded bg-surface-container" />
        </div>
        <div className="h-3.5 w-40 animate-pulse rounded bg-surface-container" />
        <div className="h-3 w-24 animate-pulse rounded bg-surface-container" />
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
  count?: number;
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
      {count !== undefined && (
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
      )}
    </button>
  );
}

function RecebimentoResumoCard({
  total,
  priorityCount,
  patioStats,
}: {
  total: number;
  priorityCount: number;
  patioStats: { capacityPercent: number; docksInUse: number; totalDocks: number };
}) {
  const stats = [
    { icon: Zap, label: 'Prior.', value: priorityCount, highlight: priorityCount > 0 },
    { icon: Warehouse, label: 'Docas', value: `${patioStats.docksInUse}/${patioStats.totalDocks}` },
    { icon: Truck, label: 'Capac.', value: `${patioStats.capacityPercent}%` },
  ] as const;

  return (
    <article className="relative overflow-hidden rounded-lg bg-primary-container px-3 py-2.5 text-on-primary-container">
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-on-primary-container/10">
          <Truck className="h-4 w-4 text-on-secondary-container" aria-hidden />
        </div>

        <div className="min-w-0 shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-on-primary-container/65">
            Recebimentos ativos
          </p>
          <p className="font-mono text-headline-md font-bold tabular-nums leading-none">{total}</p>
        </div>

        <div className="mx-0.5 h-8 w-px shrink-0 bg-on-primary-container/15" aria-hidden />

        <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
          {stats.map(({ icon: Icon, label, value, highlight }) => (
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
          aria-valuenow={patioStats.capacityPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Capacidade de pátio"
        >
          <div
            className="h-full rounded-full bg-secondary-container transition-all duration-500"
            style={{ width: `${patioStats.capacityPercent}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[10px] font-semibold tabular-nums text-on-primary-container/75">
          {patioStats.capacityPercent}% pátio
        </span>
      </div>

      <div
        className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-secondary opacity-15 blur-xl"
        aria-hidden
      />
    </article>
  );
}

export function ListaDemandaView() {
  const { state, actions } = useListaDemanda();
  const {
    search,
    filteredDemands,
    patioStats,
    isLoading,
    isStale,
    isRefreshing,
    missingUnidadeId,
    unidadeId,
    unidadeError,
    fetchError,
  } = state;
  const { loadingId, error: iniciarError, handleIniciarDemanda } = useIniciarDemanda();
  const [activeFilter, setActiveFilter] = useState<DemandFilter>('all');

  const handleRefresh = useCallback(async () => {
    hapticMedium();
    await actions.refresh();
  }, [actions]);

  const priorityCount = useMemo(
    () => filteredDemands.filter((d) => d.isPriority).length,
    [filteredDemands]
  );

  const displayedDemands = useMemo(
    () =>
      activeFilter === 'priority'
        ? filteredDemands.filter((d) => d.isPriority)
        : filteredDemands,
    [activeFilter, filteredDemands]
  );

  const isFilteredEmpty = !isLoading && displayedDemands.length === 0;
  const demandCount = filteredDemands.length;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="page-enter flex flex-col">
        <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
          <div className="flex h-14 items-center gap-3 px-margin-mobile">
            <Link
              to="/"
              aria-label="Voltar ao menu"
              onPointerDown={() => hapticLight()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
                  Recebimento
                </h1>
                {isStale && (
                  <span className="shrink-0 rounded-full bg-warning-container px-2 py-0.5 text-[10px] font-medium text-on-warning-container">
                    Offline
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="truncate font-mono text-label-sm text-on-surface-variant">
                  {isLoading
                    ? 'Carregando demandas...'
                    : missingUnidadeId
                      ? 'Selecione uma unidade para ver as demandas'
                      : `${displayedDemands.length} de ${demandCount} demandas`}
                </p>
                {!isLoading ? <UnidadeSelector compact /> : null}
              </div>
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
                placeholder="Fornecedor, ID ou empresa..."
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
                <FilterChip
                  label="Todas"
                  count={demandCount}
                  active={activeFilter === 'all'}
                  onClick={() => setActiveFilter('all')}
                />
                <FilterChip
                  label="Prioritárias"
                  count={priorityCount}
                  active={activeFilter === 'priority'}
                  onClick={() => setActiveFilter('priority')}
                />
              </div>
            )}
          </div>
        </div>

        <section className="flex flex-col gap-2 px-margin-mobile pb-[calc(80px+env(safe-area-inset-bottom,0px))] pt-3">
          {!isLoading && (
            <RecebimentoResumoCard
              total={demandCount}
              priorityCount={priorityCount}
              patioStats={patioStats}
            />
          )}

          {!isLoading && !isFilteredEmpty && (
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
                <Truck className="h-4 w-4 text-secondary" aria-hidden />
                {activeFilter === 'priority' ? 'Prioritárias' : 'Aguardando conferência'}
              </h2>
              <span className="rounded-full bg-surface-container px-2.5 py-0.5 font-mono text-label-sm tabular-nums text-on-surface-variant">
                {displayedDemands.length}
              </span>
            </div>
          )}

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <DemandCardSkeleton key={i} />)
          ) : missingUnidadeId ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-surface-container">
                <Warehouse className="h-8 w-8 text-outline" aria-hidden />
              </div>
              <p className="text-headline-md font-semibold text-on-surface">
                Unidade não vinculada
              </p>
              <p className="max-w-xs text-body-sm text-on-surface-variant">
                {unidadeError ??
                  'Seu usuário precisa estar vinculado a um funcionário com unidade. Peça ao administrador.'}
              </p>
            </div>
          ) : isFilteredEmpty ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-surface-container">
                <PackageSearch className="h-8 w-8 text-outline" aria-hidden />
              </div>
              <p className="text-headline-md font-semibold text-on-surface">
                Nenhuma demanda encontrada
              </p>
              <p className="max-w-xs text-body-sm text-on-surface-variant">
                {fetchError
                  ? fetchError
                  : search || activeFilter === 'priority'
                    ? 'Ajuste os filtros ou a busca.'
                    : 'Não há recebimentos pendentes para conferência nesta unidade.'}
              </p>
            </div>
          ) : (
            displayedDemands.map((demand) => {
              const isStarting = loadingId === demand.id;
              const awaitingApproval =
                demand.preRecebimentoSituacao === 'aguardando_aprovacao';

              return (
                <button
                  key={demand.id}
                  type="button"
                  disabled={loadingId !== null || awaitingApproval}
                  onClick={() => void handleIniciarDemanda(demand)}
                  className="relative block w-full touch-manipulation text-left disabled:opacity-70"
                >
                  <DemandCard
                    id={demand.id}
                    supplier={demand.supplier}
                    dock={demand.dock}
                    arrival={demand.arrival}
                    companies={demand.companies ?? ['LDB']}
                    isPriority={demand.isPriority}
                    pulse={demand.pulse}
                    status={demand.statusLabel ?? 'Aguardando'}
                    tagLabel={demand.tagLabel}
                    tagVariant={demand.tagVariant}
                    skuCount={demand.skuCount}
                  />
                  {isStarting && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-surface/70">
                      <Loader2 className="h-6 w-6 animate-spin text-secondary" aria-hidden />
                    </div>
                  )}
                </button>
              );
            })
          )}

          {iniciarError && (
            <p className="rounded-lg bg-error-container px-3 py-2 text-body-sm text-on-error-container">
              {iniciarError}
            </p>
          )}
        </section>
      </div>
    </PullToRefresh>
  );
}
