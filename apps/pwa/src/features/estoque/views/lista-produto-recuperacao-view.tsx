import { Button, cn } from '@lilog/ui';
import { Link, useParams } from '@tanstack/react-router';
import {
  ArrowLeft,
  CheckCircle,
  ClipboardList,
  PackageSearch,
  Search,
} from 'lucide-react';

import { CountBadge } from '../components/quantidade-badge';
import { hapticLight } from '@/lib/haptics';

import { RecuperacaoDemandaItensSummary } from '../components/recuperacao-demanda-itens-summary';
import { RecuperacaoItemCard } from '../components/recuperacao-item-card';
import {
  type RecuperacaoItemFilter,
  useListaProdutoRecuperacao,
} from '../hooks/use-lista-produto-recuperacao';

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

export function ListaProdutoRecuperacaoView() {
  const { demandaId } = useParams({
    from: '/estoque/recuperacao/$demandaId/',
  });
  const { state, actions } = useListaProdutoRecuperacao(demandaId);
  const {
    demanda,
    itens,
    search,
    itemFilter,
    itemFilters,
    counts,
    isEmpty,
    pendentes,
    concluidos,
    progressPercent,
    totalItens,
  } = state;

  if (!demanda) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-8 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container">
          <PackageSearch className="h-8 w-8 text-outline" aria-hidden />
        </div>
        <p className="text-headline-md font-semibold text-on-surface">
          Demanda não encontrada
        </p>
        <Link
          to="/estoque/recuperacao"
          onPointerDown={() => hapticLight()}
          className="text-secondary underline"
        >
          Voltar à lista
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          <Link
            to="/estoque/recuperacao"
            aria-label="Voltar às demandas"
            onPointerDown={() => hapticLight()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
              Itens da demanda
            </h1>
            <p className="truncate font-mono text-label-sm text-on-surface-variant">
              #{demanda.id}
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container">
            <ClipboardList
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
              placeholder="SKU ou nome do produto"
              aria-label="Filtrar itens"
              className="h-10 w-full rounded-full border border-outline-variant bg-surface-container py-2 pl-10 pr-4 text-body-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant focus:border-secondary focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div
            className="hide-scrollbar -mx-margin-mobile flex gap-2 overflow-x-auto px-margin-mobile pb-0.5"
            role="tablist"
            aria-label="Filtrar por status do item"
          >
            {itemFilters.map((f) => (
              <FilterChip
                key={f.id}
                label={f.label}
                count={counts[f.id as RecuperacaoItemFilter]}
                active={itemFilter === f.id}
                onClick={() => actions.setItemFilter(f.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <RecuperacaoDemandaItensSummary
        demanda={demanda}
        totalItens={totalItens}
        pendentes={pendentes}
        concluidos={concluidos}
        progressPercent={progressPercent}
      />

      {demanda.status === 'finalizada' && (
        <div className="mx-margin-mobile mt-3">
          <Button
            type="button"
            onClick={actions.verResumo}
            className="h-12 w-full rounded-lg bg-secondary text-on-secondary transition-transform touch-manipulation active:scale-95"
          >
            <CheckCircle className="mr-2 h-4 w-4" aria-hidden />
            Ver resumo da demanda
          </Button>
        </div>
      )}

      <section className="space-y-2 px-margin-mobile pt-3">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container">
              <PackageSearch className="h-8 w-8 text-outline" aria-hidden />
            </div>
            <p className="text-headline-md font-semibold text-on-surface">
              Nenhum item encontrado
            </p>
            <p className="max-w-xs text-body-sm text-on-surface-variant">
              {search
                ? 'Ajuste a busca para ver outros itens.'
                : 'Não há itens neste status no momento.'}
            </p>
          </div>
        ) : (
          itens.map((item) => (
            <RecuperacaoItemCard
              key={item.id}
              item={item}
              onIniciar={() => actions.iniciarItem(item.id)}
              onInfo={() => actions.verDetalhe(item.id)}
            />
          ))
        )}
      </section>

      {totalItens > 0 && (
        <div className="mx-margin-mobile mt-4 mb-2 rounded-lg border border-outline-variant bg-surface p-4">
          <div className="mb-2 flex justify-between text-label-sm text-on-surface-variant">
            <span>Progresso da carga</span>
            <span className="font-mono font-semibold tabular-nums text-on-surface">
              {progressPercent}%
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-surface-container"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso ${progressPercent}%`}
          >
            <div
              className="h-full rounded-full bg-secondary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-label-sm text-on-surface-variant">
            {concluidos} conferidos de {totalItens} itens · {pendentes}{' '}
            pendentes
          </p>
        </div>
      )}

      {pendentes === 0 && demanda.status !== 'finalizada' && totalItens > 0 && (
        <p className="mx-margin-mobile mt-2 text-center text-body-sm text-on-surface-variant">
          Todos os itens foram processados.
        </p>
      )}
    </div>
  );
}
