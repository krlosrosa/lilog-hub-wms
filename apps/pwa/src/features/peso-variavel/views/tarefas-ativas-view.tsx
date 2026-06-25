import { cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  Loader2,
  PackageSearch,
  RefreshCw,
  Scale,
  Search,
  Zap,
} from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import { TarefaCard } from '../components/tarefa-card';
import { TAB_LABELS } from '../data/peso-variavel-seed';
import { useTarefasAtivas } from '../hooks/use-tarefas-ativas';
import type { TarefaTab } from '../types/peso-variavel.schema';

function TarefaCardSkeleton() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-outline-variant bg-surface p-3">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-surface-container" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex justify-between gap-2">
          <div className="h-4 w-28 animate-pulse rounded bg-surface-container" />
          <div className="h-4 w-12 animate-pulse rounded bg-surface-container" />
        </div>
        <div className="h-3.5 w-36 animate-pulse rounded bg-surface-container" />
        <div className="h-4 w-24 animate-pulse rounded-full bg-surface-container" />
      </div>
      <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-surface-container" />
    </div>
  );
}

function TabChip({
  label,
  count,
  active,
  onClick,
  tab,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: (tab: TarefaTab) => void;
  tab: TarefaTab;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => {
        hapticLight();
        onClick(tab);
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

function PesoVariavelResumoCard({
  total,
  tabCounts,
  stats,
}: {
  total: number;
  tabCounts: { pendentes: number; em_andamento: number };
  stats: { express: number; altoValor: number };
}) {
  const andamentoPercent =
    total > 0 ? Math.round((tabCounts.em_andamento / total) * 100) : 0;

  const statItems = [
    { icon: ClipboardList, label: 'Pend.', value: tabCounts.pendentes },
    { icon: Clock, label: 'Andam.', value: tabCounts.em_andamento },
    {
      icon: Zap,
      label: 'Express',
      value: stats.express,
      highlight: stats.express > 0,
    },
  ] as const;

  return (
    <article className="relative overflow-hidden rounded-lg bg-primary-container px-3 py-2.5 text-on-primary-container">
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-on-primary-container/10">
          <Scale className="h-4 w-4 text-on-secondary-container" aria-hidden />
        </div>

        <div className="min-w-0 shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-on-primary-container/65">
            Separação ativa
          </p>
          <p className="font-mono text-headline-md font-bold tabular-nums leading-none">
            {total}
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
          aria-valuenow={andamentoPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Percentual de tarefas em andamento"
        >
          <div
            className="h-full rounded-full bg-secondary-container transition-all duration-500"
            style={{ width: `${andamentoPercent}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[10px] font-semibold tabular-nums text-on-primary-container/75">
          {andamentoPercent}% andamento
        </span>
      </div>

      {stats.altoValor > 0 && (
        <p className="relative z-10 mt-1.5 text-[10px] text-on-secondary-container">
          {stats.altoValor} tarefa{stats.altoValor === 1 ? '' : 's'} de alto valor
        </p>
      )}

      <div
        className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-secondary opacity-15 blur-xl"
        aria-hidden
      />
    </article>
  );
}

export function TarefasAtivasView() {
  const { state, actions } = useTarefasAtivas();
  const isEmpty = state.filteredTarefas.length === 0;

  return (
    <div className="page-enter flex flex-col">
      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          <Link
            to="/"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant active:scale-90 transition-transform touch-manipulation"
            aria-label="Voltar ao início"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
              Peso Variável
            </h1>
            <p className="truncate font-mono text-label-sm text-on-surface-variant">
              {state.isRefreshing
                ? 'Atualizando...'
                : `${state.filteredTarefas.length} de ${state.stats.total} tarefas`}
            </p>
          </div>
          <button
            type="button"
            disabled={state.isRefreshing}
            onClick={() => void actions.handleRefresh()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant active:scale-90 transition-transform touch-manipulation disabled:opacity-50"
            aria-label="Atualizar tarefas"
          >
            {state.isRefreshing ? (
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
              value={state.search}
              onChange={(e) => actions.setSearch(e.target.value)}
              placeholder="Pedido, zona ou descrição..."
              aria-label="Buscar tarefas"
              className="h-10 w-full rounded-full border border-outline-variant bg-surface-container py-2 pl-10 pr-4 text-body-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:border-secondary focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div
            className="hide-scrollbar -mx-margin-mobile flex gap-2 overflow-x-auto px-margin-mobile"
            role="tablist"
            aria-label="Status das tarefas"
          >
            {(['pendentes', 'em_andamento'] as TarefaTab[]).map((tab) => (
              <TabChip
                key={tab}
                tab={tab}
                label={TAB_LABELS[tab]}
                count={state.tabCounts[tab]}
                active={state.activeTab === tab}
                onClick={actions.setActiveTab}
              />
            ))}
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-2 px-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-3">
        <PesoVariavelResumoCard
          total={state.stats.total}
          tabCounts={state.tabCounts}
          stats={state.stats}
        />

        {!isEmpty && (
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
              <Scale className="h-4 w-4 text-secondary" aria-hidden />
              {state.activeTab === 'pendentes' ? 'Aguardando separação' : 'Em separação'}
            </h2>
            <span className="rounded-full bg-surface-container px-2.5 py-0.5 font-mono text-label-sm tabular-nums text-on-surface-variant">
              {state.filteredTarefas.length}
            </span>
          </div>
        )}

        {state.isRefreshing ? (
          Array.from({ length: 3 }).map((_, i) => <TarefaCardSkeleton key={i} />)
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-surface-container">
              {state.search ? (
                <PackageSearch className="h-8 w-8 text-outline" aria-hidden />
              ) : (
                <ClipboardList className="h-8 w-8 text-outline" aria-hidden />
              )}
            </div>
            <p className="text-headline-md font-semibold text-on-surface">
              Nenhuma tarefa encontrada
            </p>
            <p className="max-w-xs text-body-sm text-on-surface-variant">
              {state.search
                ? 'Tente ajustar a busca.'
                : `Nenhuma tarefa ${state.activeTab === 'pendentes' ? 'pendente' : 'em andamento'} no momento.`}
            </p>
          </div>
        ) : (
          state.filteredTarefas.map((tarefa) => (
            <TarefaCard key={tarefa.id} tarefa={tarefa} onIniciar={actions.handleIniciar} />
          ))
        )}
      </section>
    </div>
  );
}
