'use client';

import { useCallback, useMemo, useState, Fragment } from 'react';

import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  Filter,
  Loader2,
  Lock,
  MapPin,
  Package,
  Search,
  TrendingDown,
  Weight,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { EnderecoKpiCard } from '@/features/enderecos/components/endereco-kpi-card';
import { Pagination } from '@/features/filiais/components/pagination';
import {
  EstoqueFiltrosSheet,
  type EstoqueFiltrosSheetState,
} from '@/features/estoque/components/estoque-filtros-sheet';
import { HistoricoProdutoSheet } from '@/features/estoque/components/historico-produto-sheet';
import {
  buildProdutoKey,
  SaldoProdutoRow,
} from '@/features/estoque/components/saldo-produto-row';
import { SaldoLotesExpandido } from '@/features/estoque/components/saldo-lotes-expandido';
import { useEstoqueGestao } from '@/features/estoque/hooks/use-estoque-gestao';
import type {
  EstoqueLoteAgrupadoItem,
  EstoqueProdutoAgrupadoItem,
  HistoricoProdutoSelecionado,
} from '@/features/estoque/types/estoque-gestao.schema';

const fieldInputClassName =
  'w-full rounded-lg border border-outline-variant bg-surface-low px-4 py-3 text-body-md text-foreground placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const glassPanelClassName =
  'rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass';

const nf = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

const nfKg = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export function EstoqueGestaoView() {
  const [filtrosSheetAberto, setFiltrosSheetAberto] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [produtosExpandidos, setProdutosExpandidos] = useState<Set<string>>(
    new Set(),
  );
  const [produtoHistorico, setProdutoHistorico] =
    useState<HistoricoProdutoSelecionado | null>(null);

  const {
    unidadeId,
    isLoading,
    produtos,
    summary,
    depositos,
    grupos,
    busca,
    setBusca,
    depositoId,
    setDepositoId,
    statusFiltro,
    setStatusFiltro,
    naturezaFiltro,
    setNaturezaFiltro,
    loteFiltro,
    setLoteFiltro,
    gruposFiltro,
    setGruposFiltro,
    pagina,
    setPagina,
    totalPaginas,
    total,
    itemsInicio,
    pageSize,
    filtrosAtivos,
    limparFiltros,
  } = useEstoqueGestao();

  const filtrosSheet = useMemo(
    (): EstoqueFiltrosSheetState => ({
      depositoId,
      statusFiltro,
      naturezaFiltro,
      loteFiltro,
      gruposFiltro,
    }),
    [depositoId, statusFiltro, naturezaFiltro, loteFiltro, gruposFiltro],
  );

  const aplicarFiltrosSheet = useCallback(
    (filtros: EstoqueFiltrosSheetState) => {
      setDepositoId(filtros.depositoId);
      setStatusFiltro(filtros.statusFiltro);
      setNaturezaFiltro(filtros.naturezaFiltro);
      setLoteFiltro(filtros.loteFiltro);
      setGruposFiltro(filtros.gruposFiltro);
      setPagina(1);
    },
    [
      setDepositoId,
      setStatusFiltro,
      setNaturezaFiltro,
      setLoteFiltro,
      setGruposFiltro,
      setPagina,
    ],
  );

  const vencimentoProximoPagina = useMemo(
    () => produtos.filter((item) => item.vencimentoProximo).length,
    [produtos],
  );

  const semDisponibilidadePagina = useMemo(
    () => produtos.filter((item) => item.saldoDisponivel <= 0).length,
    [produtos],
  );

  const toggleProdutoExpandido = useCallback((key: string) => {
    setProdutosExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const abrirHistoricoProduto = useCallback((item: EstoqueProdutoAgrupadoItem) => {
    setProdutoHistorico({
      produtoId: item.produtoId,
      produtoSku: item.produtoSku,
      produtoDescricao: item.produtoDescricao,
      lote: '',
    });
    setHistoricoAberto(true);
  }, []);

  const abrirHistoricoLote = useCallback((item: EstoqueLoteAgrupadoItem) => {
    setProdutoHistorico({
      produtoId: item.produtoId,
      produtoSku: item.produtoSku,
      produtoDescricao: item.produtoDescricao,
      lote: item.lote,
    });
    setHistoricoAberto(true);
  }, []);

  const abrirHistoricoPosicao = useCallback(
    (params: HistoricoProdutoSelecionado) => {
      setProdutoHistorico(params);
      setHistoricoAberto(true);
    },
    [],
  );

  const fecharHistorico = useCallback((open: boolean) => {
    setHistoricoAberto(open);
    if (!open) {
      setProdutoHistorico(null);
    }
  }, []);

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-4 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4 md:space-y-5">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Estoque · WMS
              </p>
              <h1 className="text-headline-md font-bold tracking-tight text-foreground md:text-headline-lg">
                Estoque e Disponibilidade
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                Visão por produto com expansão de lotes e posições em endereço.
                Clique na seta para detalhar o estoque.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[12rem] flex-1 sm:flex-none">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  placeholder="Buscar produto, lote ou endereço..."
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  className={cn(
                    fieldInputClassName,
                    'h-9 w-full py-1.5 pl-8 pr-3 text-xs sm:w-60',
                  )}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setFiltrosSheetAberto(true)}
              >
                <Filter className="size-3.5" aria-hidden />
                Filtros
                {filtrosAtivos > 0 && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    {filtrosAtivos}
                  </span>
                )}
              </Button>

              {filtrosAtivos > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={limparFiltros}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </header>

          <div className="grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-6">
            <EnderecoKpiCard
              icon={
                <Package className="size-4 shrink-0 text-tertiary" aria-hidden />
              }
              label="Disponível"
              value={nf.format(summary.saldoDisponivel)}
              variant="tertiary"
            />
            <EnderecoKpiCard
              icon={
                <Boxes className="size-4 shrink-0 text-primary" aria-hidden />
              }
              label="Físico liberado"
              value={nf.format(summary.saldoFisico)}
            />
            <EnderecoKpiCard
              icon={
                <TrendingDown
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              }
              label="Reservado"
              value={nf.format(summary.saldoReservado)}
            />
            <EnderecoKpiCard
              icon={
                <Lock className="size-4 shrink-0 text-destructive" aria-hidden />
              }
              label="Bloqueado"
              value={nf.format(summary.saldoBloqueado)}
              variant="critical"
            />
            <EnderecoKpiCard
              icon={
                <AlertTriangle
                  className="size-4 shrink-0 text-amber-600 dark:text-amber-400"
                  aria-hidden
                />
              }
              label="Débito"
              value={nf.format(summary.saldoDebito)}
            />
            <EnderecoKpiCard
              icon={
                <Weight className="size-4 shrink-0 text-primary" aria-hidden />
              }
              label="Peso Físico (kg)"
              value={nfKg.format(summary.pesoLiquidoTotalKg)}
            />
          </div>

          {unidadeId && !isLoading && total > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" aria-hidden />
                <span>
                  <strong className="font-semibold text-foreground">
                    {nf.format(total)}
                  </strong>{' '}
                  {total === 1 ? 'produto' : 'produtos'} no resultado
                </span>
              </span>
              {vencimentoProximoPagina > 0 && (
                <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <CalendarClock className="size-3.5" aria-hidden />
                  {vencimentoProximoPagina} com validade próxima nesta página
                </span>
              )}
              {semDisponibilidadePagina > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5" aria-hidden />
                  {semDisponibilidadePagina} sem saldo disponível nesta página
                </span>
              )}
            </div>
          )}

          <div className={cn(glassPanelClassName, 'overflow-hidden')}>
            {!unidadeId ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                <Boxes className="size-8 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium text-foreground">
                  Selecione uma unidade
                </p>
                <p className="max-w-md text-xs text-muted-foreground">
                  Escolha a unidade operacional para visualizar saldos e
                  disponibilidade de estoque.
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Carregando estoque...
              </div>
            ) : produtos.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                <Package className="size-8 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium text-foreground">
                  Nenhum saldo encontrado
                </p>
                <p className="max-w-md text-xs text-muted-foreground">
                  Ajuste os filtros ou a busca para localizar produtos em
                  endereços do depósito.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className={compactTableClassName}>
                    <thead>
                      <tr className={compactTableHeadRowClassName}>
                        {[
                          { label: '', className: 'w-10' },
                          { label: 'Produto', className: 'min-w-[200px]' },
                          {
                            label: 'Grupo',
                            className: 'hidden min-w-[72px] sm:table-cell',
                          },
                          {
                            label: 'Lotes / Posições',
                            className: 'min-w-[120px]',
                          },
                          { label: 'Físico', className: 'w-20 text-right' },
                          {
                            label: 'Peso (kg)',
                            className: 'hidden w-24 text-right xl:table-cell',
                          },
                          {
                            label: 'Reserv.',
                            className: 'hidden w-20 text-right sm:table-cell',
                          },
                          {
                            label: 'Disp.',
                            className: 'w-20 text-right font-bold text-tertiary',
                          },
                          {
                            label: 'Bloq.',
                            className: 'hidden w-20 text-right xl:table-cell',
                          },
                          { label: 'Status', className: 'w-28' },
                          {
                            label: 'Atualizado',
                            className: 'hidden min-w-[108px] 2xl:table-cell',
                          },
                          { label: '', className: 'w-10' },
                        ].map((column) => (
                          <th
                            key={column.label}
                            className={compactTableHeadCellClassName(
                              column.className,
                            )}
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={compactTableBodyClassName}>
                      {produtos.map((item) => {
                        const produtoKey = buildProdutoKey(item);
                        const expandido = produtosExpandidos.has(produtoKey);

                        return (
                          <Fragment key={produtoKey}>
                            <SaldoProdutoRow
                              item={item}
                              expandido={expandido}
                              onToggleExpandido={() =>
                                toggleProdutoExpandido(produtoKey)
                              }
                              onVerHistorico={abrirHistoricoProduto}
                            />
                            <SaldoLotesExpandido
                              produto={item}
                              unidadeId={unidadeId}
                              depositoId={depositoId || undefined}
                              statusFiltro={statusFiltro}
                              naturezaFiltro={naturezaFiltro}
                              loteFiltro={loteFiltro}
                              gruposFiltro={gruposFiltro}
                              expandido={expandido}
                              onVerHistoricoLote={abrirHistoricoLote}
                              onVerHistoricoPosicao={abrirHistoricoPosicao}
                            />
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  pagina={pagina}
                  totalPaginas={totalPaginas}
                  onChangePagina={setPagina}
                  totalFiltrados={total}
                  itemsInicio={itemsInicio}
                  pageSize={pageSize}
                  resourceLabelPlural="produtos"
                  compact
                />
              </>
            )}
          </div>
        </div>
      </main>

      <EstoqueFiltrosSheet
        open={filtrosSheetAberto}
        onOpenChange={setFiltrosSheetAberto}
        filtros={filtrosSheet}
        onAplicar={aplicarFiltrosSheet}
        depositos={depositos}
        grupos={grupos}
      />

      <HistoricoProdutoSheet
        open={historicoAberto}
        onOpenChange={fecharHistorico}
        produto={produtoHistorico}
      />
    </SidebarMain>
  );
}
