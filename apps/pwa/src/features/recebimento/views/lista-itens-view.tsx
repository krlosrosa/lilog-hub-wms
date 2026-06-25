import { Button, cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Clock,
  GitCompareArrows,
  Loader2,
  Package,
  PackageCheck,
  PackageSearch,
  Plus,
  QrCode,
  Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import { AdicionarProdutoSheet } from '../components/adicionar-produto-sheet';
import { SKU_ITEM_FILTERS, useListaItens } from '../hooks/use-lista-itens';
import type { SkuItem, SkuItemFilter } from '../types/recebimento.schema';

interface ListaItensViewProps {
  demandId: string;
}

function ConferenciaBottomDock({
  canFinalize,
  isFinalizing,
  onFinalize,
}: {
  canFinalize: boolean;
  isFinalizing: boolean;
  onFinalize: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 w-full pb-safe">
      <div className="pointer-events-auto border-t border-outline-variant/60 bg-surface/95 px-margin-mobile pt-3 shadow-[0_-8px_24px_rgba(11,28,48,0.1)] backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
        <Button
          type="button"
          onClick={() => {
            hapticMedium();
            void onFinalize();
          }}
          disabled={!canFinalize || isFinalizing}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2 rounded-lg text-label-md font-semibold touch-manipulation active:scale-[0.98] transition-transform',
            canFinalize
              ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
              : 'bg-surface-container-high text-on-surface-variant'
          )}
        >
          {isFinalizing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Finalizando...
            </>
          ) : (
            <>
              <PackageCheck className="h-5 w-5" aria-hidden />
              Finalizar conferência
            </>
          )}
        </Button>
      </div>
    </div>,
    document.body
  );
}

function FloatingAddButton({ onClick }: { onClick: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <button
      type="button"
      aria-label="Adicionar item"
      onClick={() => {
        hapticLight();
        onClick();
      }}
      className="pointer-events-auto fixed bottom-[calc(72px+env(safe-area-inset-bottom,0px)+12px)] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-lg touch-manipulation active:scale-90 transition-transform"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden />
    </button>,
    document.body
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

function ConferenciaResumoCard({
  cargaId,
  dock,
  progress,
}: {
  cargaId: string;
  dock: string;
  progress: { counted: number; total: number; pending: number; percent: number };
}) {
  const stats: { label: string; value: number; highlight?: boolean }[] = [
    { label: 'Conf.', value: progress.counted },
    { label: 'Pend.', value: progress.pending, highlight: progress.pending > 0 },
    { label: 'Total', value: progress.total },
  ];

  return (
    <article className="relative overflow-hidden rounded-lg bg-primary-container px-3 py-2.5 text-on-primary-container">
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-on-primary-container/10">
          <PackageCheck className="h-4 w-4 text-on-secondary-container" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-on-primary-container/65">
            Conferência cega
          </p>
          <p className="truncate font-mono text-label-md font-semibold leading-tight">
            {cargaId}
          </p>
          <p className="truncate text-[10px] text-on-primary-container/70">Doca {dock}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-headline-md font-bold tabular-nums leading-none">
            {progress.percent}%
          </p>
          <p className="text-[10px] text-on-primary-container/65">conferido</p>
        </div>
      </div>

      <div className="relative z-10 mt-2 flex items-center gap-2">
        <div
          className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-on-primary-container/15"
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da conferência"
        >
          <div
            className="h-full rounded-full bg-secondary-container transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className="flex shrink-0 gap-2">
          {stats.map(({ label, value, highlight }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] uppercase tracking-wide text-on-primary-container/60">
                {label}
              </span>
              <span
                className={cn(
                  'font-mono text-label-sm font-semibold tabular-nums leading-none',
                  highlight && 'text-on-secondary-container'
                )}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-secondary opacity-15 blur-xl"
        aria-hidden
      />
    </article>
  );
}

function SkuItemRow({
  item,
  onClick,
}: {
  item: SkuItem;
  onClick: (item: SkuItem) => void;
}) {
  const isConferido = item.status === 'conferido';

  return (
    <button
      type="button"
      onClick={() => {
        hapticLight();
        onClick(item);
      }}
      className={cn(
        'group flex w-full items-center gap-2.5 overflow-hidden rounded-lg border border-outline-variant bg-surface p-3 text-left shadow-sm',
        'touch-manipulation transition-all duration-150 active:scale-[0.98] active:bg-surface-container-low',
        isConferido && 'border-l-[3px] border-l-secondary bg-secondary/[0.04]',
        !isConferido && item.hasAvaria && 'border-l-[3px] border-l-warning',
        !isConferido && item.hasDivergencia && !item.hasAvaria && 'border-l-[3px] border-l-destructive/60'
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          isConferido
            ? 'bg-secondary-container text-on-secondary-container'
            : 'bg-surface-container text-secondary'
        )}
      >
        {isConferido ? (
          <CheckCircle className="h-4 w-4" aria-hidden />
        ) : (
          <Package className="h-4 w-4" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span
            className={cn(
              'truncate font-mono text-label-md font-bold',
              isConferido ? 'text-secondary' : 'text-primary'
            )}
          >
            {item.sku}
          </span>
          {!isConferido && (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-surface-container-high px-1.5 py-px text-[10px] font-medium text-on-surface-variant">
              <Clock className="h-2.5 w-2.5" aria-hidden />
              Pendente
            </span>
          )}
        </div>

        <p className="line-clamp-1 text-body-sm text-on-surface-variant">{item.name}</p>

        {(item.hasAvaria || item.hasDivergencia || isConferido) && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {isConferido && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary-container/60 px-1.5 py-px text-[10px] font-medium text-on-secondary-container">
                <CheckCircle className="h-2.5 w-2.5" aria-hidden />
                Conferido
              </span>
            )}
            {item.hasAvaria && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-warning-container px-1.5 py-px text-[10px] font-medium text-on-warning-container">
                <AlertTriangle className="h-2.5 w-2.5" aria-hidden />
                Avaria
              </span>
            )}
            {item.hasDivergencia && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-outline-variant bg-surface-container-low px-1.5 py-px text-[10px] font-medium text-on-surface-variant">
                <GitCompareArrows className="h-2.5 w-2.5 text-secondary" aria-hidden />
                Divergência
              </span>
            )}
          </div>
        )}
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-outline transition-transform group-active:translate-x-0.5"
        aria-hidden
      />
    </button>
  );
}

function getFilterLabel(activeFilter: SkuItemFilter | null): string {
  if (!activeFilter) return 'Itens conferidos';
  return SKU_ITEM_FILTERS.find((f) => f.id === activeFilter)?.label ?? 'Itens conferidos';
}

export function ListaItensView({ demandId }: ListaItensViewProps) {
  const { state, actions } = useListaItens(demandId);
  const {
    demand,
    search,
    activeFilter,
    filterCounts,
    items,
    progress,
    isEmpty,
    cargaId,
    dock,
    sheetOpen,
    skuInput,
    skuPreview,
    sheetError,
    isValidating,
    canFinalize,
    isFinalizing,
  } = state;

  return (
    <div className="page-enter flex flex-col">
      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          <Link
            to="/recebimento/$id/checklist"
            params={{ id: demandId }}
            aria-label="Voltar para checklist"
            onPointerDown={() => hapticLight()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
              Itens conferidos
            </h1>
            <p className="truncate font-mono text-label-sm text-on-surface-variant">
              {demand ? `${demand.supplier} · ${demand.dock}` : demandId}
            </p>
          </div>
          <Link
            to="/recebimento/$id/"
            params={{ id: demandId }}
            search={{ init: String(Date.now()) }}
            aria-label="Continuar conferência"
            onClick={() => hapticLight()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary transition-transform active:scale-90 touch-manipulation"
          >
            <QrCode className="h-5 w-5" aria-hidden />
          </Link>
        </div>

        <div className="space-y-2.5 px-margin-mobile pb-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline"
              aria-hidden
            />
            <input
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              value={search}
              onChange={(e) => actions.setSearch(e.target.value)}
              placeholder="Escanear ou buscar SKU..."
              aria-label="Buscar SKU"
              className="h-10 w-full rounded-full border border-outline-variant bg-surface-container py-2 pl-10 pr-4 text-body-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:border-secondary focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div
            className="hide-scrollbar -mx-margin-mobile flex gap-2 overflow-x-auto px-margin-mobile"
            role="group"
            aria-label="Filtros rápidos"
          >
            {SKU_ITEM_FILTERS.map(({ id, label }) => (
              <FilterChip
                key={id}
                label={label}
                count={filterCounts[id]}
                active={activeFilter === id}
                onClick={() => actions.toggleFilter(id)}
              />
            ))}
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-2 px-margin-mobile pb-[calc(88px+env(safe-area-inset-bottom,0px))] pt-3">
        <ConferenciaResumoCard cargaId={cargaId} dock={dock} progress={progress} />

        {!isEmpty && (
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
              <Package className="h-4 w-4 text-secondary" aria-hidden />
              {getFilterLabel(activeFilter)}
            </h2>
            <span className="rounded-full bg-surface-container px-2.5 py-0.5 font-mono text-label-sm tabular-nums text-on-surface-variant">
              {items.length}
            </span>
          </div>
        )}

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-surface-container">
              <PackageSearch className="h-8 w-8 text-outline" aria-hidden />
            </div>
            <p className="text-headline-md font-semibold text-on-surface">Nenhum item conferido</p>
            <p className="max-w-xs text-body-sm text-on-surface-variant">
              {activeFilter || search
                ? 'Ajuste o filtro ou a busca.'
                : 'Conferir itens no fluxo de bip para aparecerem aqui.'}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2" role="list">
            {items.map((item) => (
              <li key={item.sku}>
                <SkuItemRow item={item} onClick={actions.handleItemClick} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConferenciaBottomDock
        canFinalize={canFinalize}
        isFinalizing={isFinalizing}
        onFinalize={actions.handleFinalize}
      />

      <FloatingAddButton onClick={actions.openAddProductSheet} />

      <AdicionarProdutoSheet
        open={sheetOpen}
        onOpenChange={actions.handleSheetOpenChange}
        skuInput={skuInput}
        onSkuInputChange={actions.handleSkuInputChange}
        preview={skuPreview}
        error={sheetError}
        isValidating={isValidating}
        onValidate={() => void actions.handleValidateProduct()}
      />
    </div>
  );
}
