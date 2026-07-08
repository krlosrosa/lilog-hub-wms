import { cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  Barcode,
  Box,
  Layers,
  Loader2,
  Lock,
  PackageSearch,
  Search,
  ShoppingCart,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { QrScannerModal } from '@/components/qr-scanner/qr-scanner-modal';
import { hapticLight } from '@/lib/haptics';

import { LocationCard } from '../components/location-card';
import { CountBadge, EstoqueStatItem, QuantidadeBadge } from '../components/quantidade-badge';
import { SolicitarPrioridadeSheet } from '../components/solicitar-prioridade-sheet';
import { SolicitarRessuprimentoSheet } from '../components/solicitar-ressuprimento-sheet';
import {
  useConsultaProduto,
  type ConsultaProdutoFeedback,
} from '../hooks/use-consulta-produto';
import type {
  FiltroTipoEstoque,
  ProdutoResult,
} from '../types/consulta-produto.schema';
import { TIPO_ESTOQUE_LABELS } from '../types/consulta-produto.schema';

const FILTRO_TIPO_OPTIONS: { id: FiltroTipoEstoque; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'picking', label: TIPO_ESTOQUE_LABELS.picking },
  { id: 'aereo', label: TIPO_ESTOQUE_LABELS.aereo },
];

function TipoEstoqueFilterChip({
  label,
  count,
  active,
  onClick,
  filtro,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: (filtro: FiltroTipoEstoque) => void;
  filtro: FiltroTipoEstoque;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onClick(filtro)}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-label-sm whitespace-nowrap transition-colors touch-manipulation active:scale-95',
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

function ConsultaFeedbackPortal({ feedback }: { feedback: ConsultaProdutoFeedback }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-margin-mobile transition-opacity duration-300',
        feedback ? 'opacity-100' : 'opacity-0',
      )}
      role="status"
      aria-live="polite"
    >
      <p
        className={cn(
          'max-w-sm rounded-lg px-4 py-2 text-center text-label-sm font-medium shadow-lg',
          feedback?.variant === 'error'
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-secondary text-on-secondary',
        )}
      >
        {feedback?.message ?? ''}
      </p>
    </div>,
    document.body,
  );
}

function ConsultaSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-[72px] animate-pulse rounded-lg bg-surface-container" />
      <div className="h-12 animate-pulse rounded-lg bg-surface-container" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 rounded-lg border border-outline-variant bg-surface p-3"
        >
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-surface-container" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-4 w-24 animate-pulse rounded bg-surface-container" />
            <div className="h-3 w-32 animate-pulse rounded bg-surface-container" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProdutoResumoCard({
  produto,
  tipoQuantidades,
}: {
  produto: ProdutoResult;
  tipoQuantidades: { picking: number; aereo: number };
}) {
  const disponivel = produto.estoqueTotal - produto.reservado;
  const reservadoPercent =
    produto.estoqueTotal > 0
      ? Math.round((produto.reservado / produto.estoqueTotal) * 100)
      : 0;
  const pickingPercent =
    produto.estoqueTotal > 0
      ? Math.round((tipoQuantidades.picking / produto.estoqueTotal) * 100)
      : 0;

  return (
    <article className="relative overflow-hidden rounded-lg bg-primary-container px-3 py-2.5 text-on-primary-container">
      <div className="relative z-10 flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-on-primary-container/10">
          <Box className="h-4 w-4 text-on-secondary-container" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-secondary-container px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-on-secondary-container">
              {produto.categoria}
            </span>
            <span className="font-mono text-[10px] text-on-primary-container/60">
              ID {produto.produtoId}
            </span>
          </div>
          <h2 className="truncate text-headline-md font-semibold leading-tight text-on-primary-container">
            {produto.nome}
          </h2>
          <p className="font-mono text-label-sm font-bold text-on-secondary-container">
            {produto.sku}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-2.5 flex items-stretch gap-2">
        <EstoqueStatItem label="Total" value={produto.estoqueTotal} unidade={produto.unidade} />
        <div className="w-px shrink-0 self-stretch bg-on-primary-container/12" aria-hidden />
        <EstoqueStatItem
          label="Reserv."
          value={produto.reservado}
          unidade={produto.unidade}
          icon={<Lock className="h-2.5 w-2.5" aria-hidden />}
        />
        <div className="w-px shrink-0 self-stretch bg-on-primary-container/12" aria-hidden />
        <EstoqueStatItem
          label="Disp."
          value={disponivel}
          unidade={produto.unidade}
          variant="accent"
        />
      </div>

      <div className="relative z-10 mt-2 flex items-center gap-2">
        <ShoppingCart
          className="h-3 w-3 shrink-0 text-on-secondary-container"
          aria-hidden
        />
        <div
          className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-on-primary-container/15"
          role="progressbar"
          aria-valuenow={pickingPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Percentual em picking"
        >
          <div
            className="h-full rounded-full bg-secondary-container transition-all duration-500"
            style={{ width: `${pickingPercent}%` }}
          />
        </div>
        <Layers className="h-3 w-3 shrink-0 text-on-primary-container/50" aria-hidden />
        <div className="flex shrink-0 items-center gap-1">
          <QuantidadeBadge value={tipoQuantidades.picking} variant="accent" size="sm" />
          <QuantidadeBadge
            value={tipoQuantidades.aereo}
            variant="destaque"
            size="sm"
            className="!text-on-primary-container/90"
          />
        </div>
      </div>

      <div className="relative z-10 mt-1.5 flex items-center gap-2">
        <div
          className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-on-primary-container/15"
          role="progressbar"
          aria-valuenow={reservadoPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Percentual reservado do estoque"
        >
          <div
            className="h-full rounded-full bg-on-primary-container/25 transition-all duration-500"
            style={{ width: `${reservadoPercent}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[10px] font-semibold tabular-nums text-on-primary-container/75">
          {reservadoPercent}% reservado
        </span>
      </div>

      <div
        className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-secondary opacity-15 blur-xl"
        aria-hidden
      />
    </article>
  );
}

export function ConsultaProdutoView() {
  const { state, actions } = useConsultaProduto();
  const {
    query,
    isSearching,
    resultado,
    filtroTipo,
    localizacoesFiltradas,
    tipoCounts,
    tipoQuantidades,
    feedback,
    scannerOpen,
    ressuprimentoDraft,
    ressuprimentoSheetOpen,
    isSubmittingRessuprimento,
    prioridadeDraft,
    prioridadeSheetOpen,
    isSubmittingPrioridade,
  } = state;

  const handleSubmitSearch = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      actions.handleSearch();
    },
    [actions],
  );

  return (
    <div className="page-enter flex flex-col">
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
              Consulta
            </h1>
            <p className="truncate font-mono text-label-sm text-on-surface-variant">
              {resultado ? resultado.sku : 'SKU ou código de barras'}
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container">
            <PackageSearch className="h-5 w-5 text-on-primary-container" aria-hidden />
          </div>
        </div>

        <form
          onSubmit={handleSubmitSearch}
          className="flex items-center gap-2 px-margin-mobile pb-3"
          aria-label="Busca de produto"
        >
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
              aria-hidden
            />
            <input
              id="consulta-sku"
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="Ex.: SKU-7821-B"
              value={query}
              onChange={(e) => actions.setQuery(e.target.value)}
              className="h-10 w-full rounded-full border border-outline-variant bg-surface-container py-2 pl-9 pr-3 text-body-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:border-secondary focus:ring-2 focus:ring-secondary"
            />
          </div>

          <button
            type="button"
            onClick={actions.openScanner}
            aria-label="Escanear código de barras"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-secondary transition-transform active:scale-90 touch-manipulation"
          >
            <Barcode className="h-5 w-5" aria-hidden />
          </button>

          <button
            type="submit"
            disabled={isSearching}
            aria-label="Buscar produto"
            className="flex h-10 shrink-0 items-center justify-center rounded-full bg-secondary px-4 text-label-sm font-semibold text-on-secondary transition-transform active:scale-95 touch-manipulation disabled:opacity-60"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              'OK'
            )}
          </button>
        </form>
      </div>

      <section className="flex flex-col gap-2 px-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-3">
        {isSearching && <ConsultaSkeleton />}

        {!isSearching && resultado && (
          <>
            <ProdutoResumoCard produto={resultado} tipoQuantidades={tipoQuantidades} />

            <div
              className="hide-scrollbar -mx-margin-mobile flex gap-2 overflow-x-auto px-margin-mobile"
              role="tablist"
              aria-label="Filtrar por tipo de estoque"
            >
              {FILTRO_TIPO_OPTIONS.map((opt) => (
                <TipoEstoqueFilterChip
                  key={opt.id}
                  filtro={opt.id}
                  label={opt.label}
                  count={tipoCounts[opt.id]}
                  active={filtroTipo === opt.id}
                  onClick={actions.setFiltroTipo}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <h2 className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
                <PackageSearch className="h-4 w-4 text-secondary" aria-hidden />
                Endereços
                {filtroTipo !== 'todos' && (
                  <span className="font-normal text-on-surface-variant">
                    · {TIPO_ESTOQUE_LABELS[filtroTipo]}
                  </span>
                )}
              </h2>
              <CountBadge count={localizacoesFiltradas.length} className="!h-6 !min-w-[1.5rem] !bg-surface-container !text-on-surface-variant !text-label-sm" />
            </div>

            {localizacoesFiltradas.length === 0 ? (
              <p className="py-6 text-center text-body-sm text-on-surface-variant">
                Nenhum endereço em{' '}
                {filtroTipo === 'todos'
                  ? 'estoque'
                  : TIPO_ESTOQUE_LABELS[filtroTipo].toLowerCase()}{' '}
                para este produto.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {localizacoesFiltradas.map((loc) => (
                  <LocationCard
                    key={loc.id}
                    localizacao={loc}
                    unidade={resultado.unidade}
                    onSolicitarRessuprimento={actions.abrirSolicitarRessuprimento}
                    onSolicitarPrioridade={actions.abrirSolicitarPrioridade}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!isSearching && !resultado && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-surface-container">
              <PackageSearch className="h-7 w-7 text-outline" aria-hidden />
            </div>
            <p className="text-headline-md font-semibold text-on-surface">
              Consultar estoque
            </p>
            <p className="max-w-xs text-body-sm text-on-surface-variant">
              Digite o SKU, escaneie o código ou busque por nome. Ex.:{' '}
              <span className="font-mono font-medium text-secondary">SKU-7821-B</span>
            </p>
          </div>
        )}
      </section>

      <ConsultaFeedbackPortal feedback={feedback} />

      <SolicitarPrioridadeSheet
        open={prioridadeSheetOpen}
        draft={prioridadeDraft}
        isSubmitting={isSubmittingPrioridade}
        onOpenChange={actions.handlePrioridadeSheetOpenChange}
        onConfirmar={actions.confirmarSolicitarPrioridade}
      />

      <SolicitarRessuprimentoSheet
        open={ressuprimentoSheetOpen}
        draft={ressuprimentoDraft}
        isSubmitting={isSubmittingRessuprimento}
        onOpenChange={actions.handleRessuprimentoSheetOpenChange}
        onConfirmar={actions.confirmarSolicitarRessuprimento}
      />

      <QrScannerModal
        open={scannerOpen}
        onOpenChange={actions.closeScanner}
        title="Escanear código do produto"
        onScan={actions.handleScanResult}
      />
    </div>
  );
}
