import { cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  ClipboardCheck,
  Loader2,
  PackageSearch,
  RefreshCw,
  Search,
  Truck,
  Zap,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { PullToRefresh } from '@/components/pull-to-refresh';
import { UnidadeSelector } from '@/features/unidade';
import { hapticLight, hapticMedium } from '@/lib/haptics';

import { ProcessStatusCard } from '../components/process-status-card';
import { V2BetaBadge } from '../components/v2-beta-badge';
import { useBootstrapV2 } from '../hooks/use-bootstrap-v2';
import { useListaDemandasV2 } from '../hooks/use-lista-demandas-v2';
import type { ProcessRecord } from '../local-db/schema';

type StatusFilter = 'all' | 'priority' | 'working' | 'ready';

function DemandCardSkeleton() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-outline-variant bg-surface p-3">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-surface-container" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex justify-between gap-2">
          <div className="h-4 w-24 animate-pulse rounded bg-surface-container" />
          <div className="h-4 w-10 animate-pulse rounded bg-surface-container" />
        </div>
        <div className="h-3.5 w-36 animate-pulse rounded bg-surface-container" />
        <div className="h-3 w-20 animate-pulse rounded bg-surface-container" />
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
          : 'bg-surface-container text-on-surface-variant',
      )}
    >
      {label}
      {count !== undefined ? (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
            active
              ? 'bg-on-secondary/20 text-on-secondary'
              : 'bg-outline-variant/30 text-on-surface-variant',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function RecebimentoResumoCard({
  total,
  priorityCount,
  workingCount,
  readyCount,
}: {
  total: number;
  priorityCount: number;
  workingCount: number;
  readyCount: number;
}) {
  const stats = [
    { icon: Zap, label: 'Prior.', value: priorityCount, highlight: priorityCount > 0 },
    { icon: ClipboardCheck, label: 'Confer.', value: workingCount },
    { icon: Truck, label: 'Prontos', value: readyCount },
  ] as const;

  return (
    <article className="rounded-lg bg-primary-container px-3 py-2.5 text-on-primary-container">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-on-primary-container/10">
          <Truck className="h-4 w-4 text-on-secondary-container" aria-hidden />
        </div>

        <div className="min-w-0 shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-on-primary-container/65">
            Demandas
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
                  highlight && 'text-on-secondary-container',
                )}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function EmptyState({
  missingUnidadeId,
  hasSearch,
  onRefresh,
  isRefreshing,
}: {
  missingUnidadeId: boolean;
  hasSearch: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-surface-container">
        <PackageSearch className="h-7 w-7 text-outline" aria-hidden />
      </div>
      <div>
        <p className="text-body-md font-semibold text-on-surface">
          {missingUnidadeId
            ? 'Selecione uma unidade'
            : hasSearch
              ? 'Nenhum resultado'
              : 'Nenhuma demanda'}
        </p>
        <p className="mt-1 max-w-xs text-label-sm text-on-surface-variant">
          {missingUnidadeId
            ? 'Escolha a unidade no topo da tela.'
            : hasSearch
              ? 'Busque por placa, fornecedor ou doca.'
              : 'Atualize a lista para sincronizar.'}
        </p>
      </div>
      {!missingUnidadeId && !hasSearch ? (
        <button
          type="button"
          disabled={isRefreshing}
          onClick={onRefresh}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-secondary px-4 text-label-sm font-semibold text-on-secondary touch-manipulation active:scale-95 disabled:opacity-50"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden />
          )}
          Atualizar
        </button>
      ) : null}
    </div>
  );
}

function matchesStatusFilter(process: ProcessRecord, filter: StatusFilter): boolean {
  switch (filter) {
    case 'priority':
      return process.status === 'pendingSync' || process.status === 'conflict';
    case 'working':
      return process.status === 'working';
    case 'ready':
      return ['ready', 'working', 'pendingSync', 'completed'].includes(process.status);
    default:
      return true;
  }
}

export function ListaDemandasV2View() {
  const {
    processos,
    filteredProcessos,
    search,
    setSearch,
    priorityCount,
    isLoading,
    isSyncing,
    isRefreshing,
    isStale,
    missingUnidadeId,
    fetchError,
    refresh,
  } = useListaDemandasV2();
  const {
    prepare,
    preparingDemandId,
    isPreparing,
    progress,
    error: bootstrapError,
    clearError,
  } = useBootstrapV2();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const handleRefresh = useCallback(async () => {
    hapticMedium();
    await refresh();
  }, [refresh]);

  const workingCount = useMemo(
    () => processos.filter((process) => process.status === 'working').length,
    [processos],
  );

  const readyCount = useMemo(
    () =>
      processos.filter((process) =>
        ['ready', 'working', 'pendingSync', 'completed'].includes(process.status),
      ).length,
    [processos],
  );

  const displayedProcessos = useMemo(
    () => filteredProcessos.filter((process) => matchesStatusFilter(process, statusFilter)),
    [filteredProcessos, statusFilter],
  );

  const demandCount = processos.length;
  const hasSearch = search.trim().length > 0;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="page-enter flex flex-col pb-safe-offset-4">
        <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
          <div className="flex h-14 items-center gap-2 px-margin-mobile">
            <Link
              to="/"
              aria-label="Voltar ao menu"
              onPointerDown={() => hapticLight()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
                  Recebimento
                </h1>
                <V2BetaBadge />
                {isStale ? (
                  <span className="shrink-0 rounded-full bg-warning-container px-1.5 py-0.5 text-[9px] font-medium text-on-warning-container">
                    Offline
                  </span>
                ) : null}
              </div>
              {!isLoading ? <UnidadeSelector compact /> : null}
            </div>

            <button
              type="button"
              disabled={isRefreshing || missingUnidadeId}
              onClick={() => void handleRefresh()}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface-container px-3 text-label-sm font-medium text-on-surface-variant transition-transform active:scale-90 touch-manipulation disabled:opacity-50"
              aria-label="Atualizar demandas"
            >
              {isRefreshing || isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
              <span className="hidden min-[380px]:inline">Atualizar</span>
            </button>
          </div>

          <div className="space-y-2 px-margin-mobile pb-2.5">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                aria-hidden
              />
              <input
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Placa, fornecedor ou doca..."
                aria-label="Buscar demandas"
                className="h-10 w-full rounded-full border border-outline-variant bg-surface-container py-2 pl-9 pr-4 text-body-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:border-secondary focus:ring-2 focus:ring-secondary"
              />
            </div>

            {!isLoading ? (
              <div
                className="hide-scrollbar -mx-margin-mobile flex gap-1.5 overflow-x-auto px-margin-mobile"
                role="tablist"
                aria-label="Filtrar demandas"
              >
                <FilterChip
                  label="Todas"
                  count={demandCount}
                  active={statusFilter === 'all'}
                  onClick={() => setStatusFilter('all')}
                />
                <FilterChip
                  label="Prioritárias"
                  count={priorityCount}
                  active={statusFilter === 'priority'}
                  onClick={() => setStatusFilter('priority')}
                />
                <FilterChip
                  label="Conferindo"
                  count={workingCount}
                  active={statusFilter === 'working'}
                  onClick={() => setStatusFilter('working')}
                />
                <FilterChip
                  label="Prontos"
                  count={readyCount}
                  active={statusFilter === 'ready'}
                  onClick={() => setStatusFilter('ready')}
                />
              </div>
            ) : null}
          </div>
        </div>

        {isStale && !isLoading ? (
          <div className="mx-margin-mobile mt-2 flex items-center justify-between gap-2 rounded-lg border border-warning/30 bg-warning-container/40 px-3 py-2">
            <p className="text-label-sm text-on-warning-container">
              Sem conexão — a lista pode estar desatualizada.
            </p>
            <button
              type="button"
              disabled={isRefreshing}
              onClick={() => void handleRefresh()}
              className="shrink-0 text-label-sm font-semibold text-on-warning-container underline touch-manipulation disabled:opacity-50"
            >
              Tentar
            </button>
          </div>
        ) : null}
        {fetchError ? (
          <p className="mx-margin-mobile mt-2 rounded-lg bg-error-container px-3 py-2 text-label-sm text-on-error-container">
            {fetchError}
          </p>
        ) : null}

        {bootstrapError ? (
          <div className="mx-margin-mobile mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
            <p className="text-label-sm text-destructive">{bootstrapError}</p>
            <button
              type="button"
              onClick={clearError}
              className="mt-1 text-label-sm font-medium text-destructive underline touch-manipulation"
            >
              Fechar
            </button>
          </div>
        ) : null}

        {isPreparing && progress ? (
          <div className="mx-margin-mobile mt-2 rounded-lg border border-outline-variant bg-surface-container/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-secondary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-label-sm text-on-surface">{progress.message}</p>
                <p className="text-[10px] text-muted-foreground">
                  {progress.stepIndex}/{progress.totalSteps}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <section className="flex flex-col gap-2 px-margin-mobile pb-2 pt-2">
          {!isLoading && demandCount > 0 ? (
            <RecebimentoResumoCard
              total={demandCount}
              priorityCount={priorityCount}
              workingCount={workingCount}
              readyCount={readyCount}
            />
          ) : null}

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <DemandCardSkeleton key={i} />)
          ) : missingUnidadeId || displayedProcessos.length === 0 ? (
            <EmptyState
              missingUnidadeId={missingUnidadeId}
              hasSearch={hasSearch || statusFilter !== 'all'}
              onRefresh={() => void handleRefresh()}
              isRefreshing={isRefreshing}
            />
          ) : (
            displayedProcessos.map((process) => (
              <ProcessStatusCard
                key={process.id}
                process={process}
                isPreparingThis={preparingDemandId === process.id}
                onPrepare={(id) => {
                  hapticLight();
                  void prepare(id);
                }}
              />
            ))
          )}
        </section>
      </div>
    </PullToRefresh>
  );
}
