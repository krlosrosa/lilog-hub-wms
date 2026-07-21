import { cn } from '@lilog/ui';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Flag,
  Loader2,
  Minus,
  Package,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { AdicionarProdutoSheetV2 } from '@/features/recebimento-v2/components/adicionar-produto-sheet-v2';
import {
  SKU_ITEM_FILTERS_V2,
  type DivergenciaItem,
  type SkuItemFilterV2,
} from '@/features/recebimento-v2/types/recebimento-v2.schema';
import { hapticLight } from '@/lib/haptics';

import { PaleteRcToolbar } from '../components/palete-rc-toolbar';
import { RcPilotIconButton } from '../components/rc-pilot-icon-button';
import { RcTemperaturaButton } from '../components/rc-pilot-temperatura-button';
import { useAdicionarItemRc } from '../hooks/use-adicionar-item-rc';
import { useConferenciaRc } from '../hooks/use-conferencia-rc';
import { useProcessLikeRc } from '../hooks/use-demanda-rc';
import { useParametrosConferenciaRc } from '../hooks/use-parametros-conferencia-rc';
import { formatDockLabel } from '../lib/demand-view-ui';

const STATUS_CONFIG: Record<
  DivergenciaItem['status'],
  { icon: typeof CheckCircle; label: string; className: string }
> = {
  ok: { icon: CheckCircle, label: 'OK', className: 'text-secondary' },
  falta: { icon: Minus, label: 'Falta', className: 'text-destructive' },
  sobra: { icon: Plus, label: 'Sobra', className: 'text-warning' },
  nao_conferido: { icon: Package, label: 'Não conferido', className: 'text-muted-foreground' },
};

function matchesFilter(item: DivergenciaItem, filter: SkuItemFilterV2): boolean {
  switch (filter) {
    case 'pendente':
      return item.status === 'nao_conferido';
    case 'divergencia':
      return item.status === 'falta' || item.status === 'sobra';
    case 'avaria':
      return item.hasAvaria === true;
    default:
      return true;
  }
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
          : 'bg-surface-container text-on-surface-variant',
      )}
    >
      {label}
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
    </button>
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
      className="pointer-events-auto fixed bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-lg touch-manipulation active:scale-90 transition-transform"
    >
      <Plus className="h-6 w-6 text-white" strokeWidth={2.5} aria-hidden />
    </button>,
    document.body,
  );
}

interface ListaItensRcViewProps {
  demandId: string;
}

export function ListaItensRcView({ demandId }: ListaItensRcViewProps) {
  const navigate = useNavigate();
  const process = useProcessLikeRc(demandId);
  const parametrosConferencia = useParametrosConferenciaRc(process?.unidadeId);
  const { getDivergencias, isLoading, removerItemAdicionado } = useConferenciaRc(demandId);
  const adicionarItem = useAdicionarItemRc(demandId);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<SkuItemFilterV2>('all');

  const divergencias = getDivergencias(parametrosConferencia.quantidadeModo);

  const filterCounts = useMemo(
    () => ({
      all: divergencias.length,
      pendente: divergencias.filter((d) => matchesFilter(d, 'pendente')).length,
      divergencia: divergencias.filter((d) => matchesFilter(d, 'divergencia')).length,
      avaria: divergencias.filter((d) => matchesFilter(d, 'avaria')).length,
    }),
    [divergencias],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return divergencias.filter((item) => {
      const matchesSearch =
        !query ||
        item.sku.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);
      return matchesSearch && matchesFilter(item, activeFilter);
    });
  }, [activeFilter, divergencias, search]);

  const okCount = divergencias.filter((d) => d.status === 'ok').length;
  const total = divergencias.length;
  const percent = total > 0 ? Math.round((okCount / total) * 100) : 0;
  const placa = process?.placa?.trim();
  const headerTitle = placa || 'Conferência';
  const dockLabel = formatDockLabel(process?.dock);
  const headerSubtitle = [
    process?.supplier && process.supplier !== demandId ? process.supplier : null,
    `${okCount}/${total} itens`,
    `Doca ${dockLabel}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="page-enter flex flex-col pb-safe-offset-20">
      <div className="sticky top-0 z-20 border-b border-outline-variant/60 bg-surface/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
        <div className="flex items-center gap-3 px-margin-mobile py-3">
          <Link
            to="/recebimento-rc"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation transition-transform active:scale-90"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1
              className={cn(
                'truncate text-headline-sm font-bold text-on-surface',
                placa && 'font-mono uppercase tracking-wide',
              )}
            >
              {headerTitle}
            </h1>
            <p className="truncate text-label-sm text-muted-foreground">{headerSubtitle}</p>
          </div>

          <div className="flex items-center gap-1.5">
            <RcPilotIconButton
              icon={RefreshCw}
              label="Status de sync"
              feature="Status de sincronização"
            />
            <Link
              to="/recebimento-rc/$id/checklist"
              params={{ id: demandId }}
              aria-label="Checklist"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation transition-transform active:scale-90"
            >
              <ClipboardCheck className="h-4.5 w-4.5" aria-hidden />
            </Link>
            <Link
              to="/recebimento-rc/$id/avarias"
              params={{ id: demandId }}
              aria-label="Avarias"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation transition-transform active:scale-90"
            >
              <AlertTriangle className="h-4.5 w-4.5" aria-hidden />
            </Link>
            <Link
              to="/recebimento-rc/$id/resumo"
              params={{ id: demandId }}
              aria-label="Finalizar conferência"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/15 text-secondary touch-manipulation transition-transform active:scale-90"
            >
              <Flag className="h-4.5 w-4.5" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="h-1 bg-surface-container">
          <div
            className="h-full bg-secondary transition-all duration-500"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={okCount}
            aria-valuemin={0}
            aria-valuemax={total}
          />
        </div>

        <div className="space-y-2.5 px-margin-mobile pb-3 pt-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar SKU ou descrição..."
              className="h-10 w-full rounded-full border border-outline-variant bg-surface-container py-2 pl-9 pr-4 text-body-sm text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="hide-scrollbar -mx-margin-mobile flex gap-2 overflow-x-auto px-margin-mobile">
            {SKU_ITEM_FILTERS_V2.map((filter) => (
              <FilterChip
                key={filter.id}
                label={filter.label}
                count={filterCounts[filter.id]}
                active={activeFilter === filter.id}
                onClick={() => setActiveFilter(filter.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="px-margin-mobile pt-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <PaleteRcToolbar
            demandId={demandId}
            controlaPalete={parametrosConferencia.controlaPalete}
            variant="header"
          />
          <RcTemperaturaButton demandId={demandId} />
        </div>
      </div>

      <div className="mt-3 divide-y divide-outline-variant/50 px-margin-mobile">
        {isLoading ? (
          <div className="space-y-2 py-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-surface-container" aria-hidden />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center">
            <PackageSearch className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-body-md text-muted-foreground">Nenhum item encontrado</p>
          </div>
        ) : (
          filteredItems.map((div) => {
            const config = STATUS_CONFIG[div.status];
            const Icon = config.icon;

            return (
              <div
                key={div.sku}
                className="flex items-center gap-2 py-3 -mx-margin-mobile px-margin-mobile"
              >
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    void navigate({
                      to: '/recebimento-rc/$id',
                      params: { id: demandId },
                      search: { sku: div.sku },
                    });
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3 touch-manipulation active:bg-surface-container/50 rounded-lg -mx-1 px-1 text-left"
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      div.status === 'ok'
                        ? 'bg-secondary/15'
                        : div.status === 'nao_conferido'
                          ? 'bg-surface-container'
                          : 'bg-destructive/10',
                    )}
                  >
                    <Icon className={cn('h-4.5 w-4.5', config.className)} aria-hidden />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-mono text-label-md font-bold text-on-surface">
                        {div.sku}
                      </p>
                      {div.isNovo ? (
                        <span className="shrink-0 rounded-full bg-primary-container px-1.5 py-0.5 text-[10px] font-semibold text-on-primary-container">
                          Novo
                        </span>
                      ) : null}
                      {div.hasAvaria ? (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-body-sm text-on-surface-variant">
                      {div.description}
                    </p>
                    {div.conferidoLabel ? (
                      <p className="mt-0.5 font-mono text-label-sm font-semibold text-secondary">
                        Conferido: {div.conferidoLabel}
                      </p>
                    ) : null}
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-outline" aria-hidden />
                </button>

                {div.isNovo ? (
                  <button
                    type="button"
                    aria-label={`Excluir item adicionado ${div.sku}`}
                    onClick={() => {
                      void removerItemAdicionado(div.sku).catch((err: unknown) => {
                        const msg = err instanceof Error ? err.message : 'Erro ao excluir item';
                        alert(msg);
                      });
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-destructive touch-manipulation transition-transform active:scale-90"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <AdicionarProdutoSheetV2
        open={adicionarItem.sheetOpen}
        onOpenChange={(open) => {
          adicionarItem.setSheetOpen(open);
          if (!open) adicionarItem.resetSheet();
        }}
        skuInput={adicionarItem.skuInput}
        onSkuInputChange={adicionarItem.handleSkuInputChange}
        error={adicionarItem.error}
        isValidating={adicionarItem.isValidating}
        onConferir={() => void adicionarItem.conferirSku()}
      />

      <FloatingAddButton onClick={() => adicionarItem.setSheetOpen(true)} />
    </div>
  );
}
