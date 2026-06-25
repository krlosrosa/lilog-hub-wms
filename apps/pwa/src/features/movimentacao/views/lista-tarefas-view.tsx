import { cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRightLeft,
  List,
  PackageSearch,
  RefreshCw,
  Search,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useCallback } from 'react';

import { PullToRefresh } from '@/components/pull-to-refresh';
import { hapticLight } from '@/lib/haptics';

import { TarefaCard } from '../components/tarefa-card';
import { useListaTarefas } from '../hooks/use-lista-tarefas';
import type { PrioridadeFilter } from '../types/movimentacao.schema';

const FILTERS: { id: PrioridadeFilter; label: string; icon?: LucideIcon }[] = [
  { id: 'todas', label: 'Todas', icon: List },
  { id: 'alta', label: 'Alta', icon: Zap },
  { id: 'media', label: 'Média', icon: AlertTriangle },
  { id: 'baixa', label: 'Baixa', icon: ArrowDown },
];

function TarefaCardSkeleton() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-outline-variant bg-surface p-3">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-surface-container" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex justify-between gap-2">
          <div className="h-4 w-24 animate-pulse rounded bg-surface-container" />
          <div className="h-4 w-8 animate-pulse rounded bg-surface-container" />
        </div>
        <div className="h-3.5 w-full animate-pulse rounded bg-surface-container" />
        <div className="h-4 w-20 animate-pulse rounded-full bg-surface-container" />
      </div>
      <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-surface-container" />
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  icon: Icon,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  icon?: LucideIcon;
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
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
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

function MovimentacaoResumoCard({
  total,
  counts,
}: {
  total: number;
  counts: { alta: number; media: number; baixa: number };
}) {
  const altaPercent = total > 0 ? Math.round((counts.alta / total) * 100) : 0;

  const stats = [
    { icon: Zap, label: 'Alta', value: counts.alta, highlight: counts.alta > 0 },
    { icon: AlertTriangle, label: 'Média', value: counts.media },
    { icon: ArrowDown, label: 'Baixa', value: counts.baixa },
  ] as const;

  return (
    <article className="relative overflow-hidden rounded-lg bg-primary-container px-3 py-2.5 text-on-primary-container">
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-on-primary-container/10">
          <ArrowRightLeft className="h-4 w-4 text-on-secondary-container" aria-hidden />
        </div>

        <div className="min-w-0 shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-on-primary-container/65">
            Tarefas ativas
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
          aria-valuenow={altaPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Percentual de tarefas de alta prioridade"
        >
          <div
            className="h-full rounded-full bg-destructive/80 transition-all duration-500"
            style={{ width: `${altaPercent}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[10px] font-semibold tabular-nums text-on-primary-container/75">
          {altaPercent}% alta
        </span>
      </div>

      <div
        className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-secondary opacity-15 blur-xl"
        aria-hidden
      />
    </article>
  );
}

export function ListaTarefasView() {
  const { state, actions } = useListaTarefas();
  const { search, filter, filteredTarefas, counts, isEmpty, isLoading, isRefreshing, error } =
    state;

  const handleRefresh = useCallback(async () => {
    await actions.refresh();
  }, [actions]);

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
            <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
              Movimentação
            </h1>
            <p className="truncate font-mono text-label-sm text-on-surface-variant">
              {isLoading
                ? 'Carregando tarefas...'
                : `${filteredTarefas.length} de ${counts.todas} tarefas`}
            </p>
          </div>
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
              placeholder="ID, zona ou item..."
              aria-label="Buscar tarefas"
              className="h-10 w-full rounded-full border border-outline-variant bg-surface-container py-2 pl-10 pr-4 text-body-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:border-secondary focus:ring-2 focus:ring-secondary"
            />
          </div>

          {!isLoading && (
            <div
              className="hide-scrollbar -mx-margin-mobile flex gap-2 overflow-x-auto px-margin-mobile"
              role="tablist"
              aria-label="Filtrar por prioridade"
            >
              {FILTERS.map((f) => (
                <FilterChip
                  key={f.id}
                  label={f.label}
                  icon={f.icon}
                  count={counts[f.id]}
                  active={filter === f.id}
                  onClick={() => actions.setFilter(f.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-2 px-margin-mobile pt-3">
        {!isLoading && (
          <MovimentacaoResumoCard
            total={counts.todas}
            counts={{ alta: counts.alta, media: counts.media, baixa: counts.baixa }}
          />
        )}

        {!isLoading && !isEmpty && (
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
              <ArrowRightLeft className="h-4 w-4 text-secondary" aria-hidden />
              Tarefas pendentes
            </h2>
            <span className="rounded-full bg-surface-container px-2.5 py-0.5 font-mono text-label-sm tabular-nums text-on-surface-variant">
              {filteredTarefas.length}
            </span>
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <TarefaCardSkeleton key={i} />)
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
            </div>
            <p className="text-headline-md font-semibold text-on-surface">Erro ao carregar</p>
            <p className="max-w-xs text-body-sm text-on-surface-variant">{error}</p>
            <button
              type="button"
              onClick={() => void actions.refresh()}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-label-md font-medium text-on-secondary touch-manipulation active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={isRefreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden />
              Tentar novamente
            </button>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-surface-container">
              <PackageSearch className="h-8 w-8 text-outline" aria-hidden />
            </div>
            <p className="text-headline-md font-semibold text-on-surface">Nenhuma tarefa</p>
            <p className="max-w-xs text-body-sm text-on-surface-variant">
              {search || filter !== 'todas'
                ? 'Ajuste os filtros ou a busca para ver outras tarefas.'
                : 'Não há movimentações pendentes no momento.'}
            </p>
          </div>
        ) : (
          filteredTarefas.map((tarefa) => (
            <TarefaCard key={tarefa.id} tarefa={tarefa} onIniciar={actions.iniciarTarefa} />
          ))
        )}
      </section>
    </div>
    </PullToRefresh>
  );
}
