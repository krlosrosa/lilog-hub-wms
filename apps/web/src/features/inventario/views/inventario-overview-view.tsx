'use client';

import Link from 'next/link';

import { useCallback } from 'react';

import { Button } from '@lilog/ui';
import { ClipboardList, Download, Filter, Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';

import { Pagination } from '@/features/filiais/components/pagination';
import { InventarioKpiCards } from '@/features/inventario/components/inventario-kpi-cards';
import { InventarioRow } from '@/features/inventario/components/inventario-row';
import { InventarioTrendChart } from '@/features/inventario/components/inventario-trend-chart';
import { useInventarioOverview } from '@/features/inventario/hooks/use-inventario-overview';

const TABLE_HEADERS = [
  { label: 'ID', className: 'w-24' },
  { label: 'Data', className: 'whitespace-nowrap' },
  { label: 'Responsável', className: 'hidden sm:table-cell min-w-[8rem]' },
  { label: 'Tipo', className: 'hidden md:table-cell w-20' },
  { label: 'Acurácia', className: 'w-16 text-center' },
  { label: 'Status', className: 'w-24' },
  { label: '', className: 'w-8 text-right' },
] as const;

export function InventarioOverviewView() {
  const {
    kpi,
    trendMensal,
    inventarios,
    busca,
    setBusca,
    pagina,
    setPagina,
    totalPaginas,
    totalFiltrados,
    pageSize,
    itemsInicio,
    carregando,
  } = useInventarioOverview();

  const filtros = useCallback(() => {
    toast.info('Filtros em construção (mock)');
  }, []);

  const exportar = useCallback(() => {
    toast.success('Exportação simulada (mock)');
  }, []);

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-4 md:px-margin-desktop md:py-5">
        <div className="mx-auto max-w-container">
          <header className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                Inventário
              </h1>
              <p className="text-[11px] text-muted-foreground md:text-xs">
                Acurácia, divergências e histórico de contagens
              </p>
            </div>
            <Button asChild size="sm" className="shrink-0 gap-1.5">
              <Link href="/inventario/novo">
                <Plus className="size-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Novo inventário</span>
                <span className="sm:hidden">Novo</span>
              </Link>
            </Button>
          </header>

          <div className="flex flex-col gap-3 md:gap-4">
            <InventarioKpiCards kpi={kpi} />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Últimos inventários
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                <div className="relative min-w-0 flex-1 sm:max-w-52 sm:flex-none">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar ID ou responsável…"
                    aria-label="Pesquisar inventários"
                    className="h-8 w-full rounded-lg border border-outline-variant bg-surface-lowest pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Filtros"
                  className="h-8 gap-1 border-outline-variant px-2.5 text-xs"
                  onClick={filtros}
                >
                  <Filter className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">Filtros</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Exportar"
                  className="h-8 gap-1 border-outline-variant px-2.5 text-xs"
                  onClick={exportar}
                >
                  <Download className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
              <div className="overflow-x-auto">
                <table className={compactTableClassName}>
                  <thead>
                    <tr className={compactTableHeadRowClassName}>
                      {TABLE_HEADERS.map((header) => (
                        <th
                          key={header.label || 'actions'}
                          className={compactTableHeadCellClassName(header.className)}
                        >
                          {header.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={compactTableBodyClassName}>
                    {carregando ? (
                      <tr>
                        <td
                          colSpan={TABLE_HEADERS.length}
                          className={compactTableEmptyCellClassName}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                            Carregando inventários…
                          </span>
                        </td>
                      </tr>
                    ) : inventarios.length > 0 ? (
                      inventarios.map((row) => (
                        <InventarioRow key={row.id} item={row} />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={TABLE_HEADERS.length}
                          className={compactTableEmptyCellClassName}
                        >
                          <ClipboardList
                            className="mx-auto mb-2 size-5 text-muted-foreground/50"
                            aria-hidden
                          />
                          Nenhum inventário encontrado para os filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalFiltrados > 0 ? (
                <Pagination
                  pagina={pagina}
                  totalPaginas={totalPaginas}
                  onChangePagina={setPagina}
                  totalFiltrados={totalFiltrados}
                  itemsInicio={itemsInicio}
                  pageSize={pageSize}
                  resourceLabelPlural="inventários"
                  compact
                />
              ) : null}
            </div>

            <InventarioTrendChart meses={trendMensal} />
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
