'use client';

import Link from 'next/link';

import { useCallback } from 'react';

import { Button, cn } from '@lilog/ui';
import { ClipboardList, Download, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';

import { SidebarMain } from '@/components/layout/sidebar';

import { Pagination } from '@/features/filiais/components/pagination';
import { InventarioKpiCards } from '@/features/inventario/components/inventario-kpi-cards';
import { InventarioRow } from '@/features/inventario/components/inventario-row';
import { InventarioTrendChart } from '@/features/inventario/components/inventario-trend-chart';
import { useInventarioOverview } from '@/features/inventario/hooks/use-inventario-overview';

const TABLE_HEADERS = [
  'ID do inventário',
  'Data',
  'Responsável',
  'Tipo',
  'Acurácia (%)',
  'Status',
  'Ações',
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
  } = useInventarioOverview();

  const filtros = useCallback(() => {
    toast.info('Filtros em construção (mock)');
  }, []);

  const exportar = useCallback(() => {
    toast.success('Exportação simulada (mock)');
  }, []);

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-primary md:text-headline-lg">
                Visão geral de inventário
              </h1>
              <p className="mt-1 text-body-md text-muted-foreground">
                Controle central de ativos, perdas e acurácia da rede.
              </p>
            </div>
            <Button asChild className="shrink-0 gap-2 self-start sm:self-auto">
              <Link href="/inventario/novo">
                <ClipboardList className="size-4 shrink-0" aria-hidden />
                Novo inventário
              </Link>
            </Button>
          </header>

          <div className="flex flex-col gap-5 md:gap-6 lg:gap-8">
            <InventarioKpiCards kpi={kpi} />

            <div className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
              <div className="flex flex-col gap-4 border-b border-outline-variant p-4 lg:flex-row lg:items-start lg:justify-between lg:p-6">
                <h2 className="text-label-md font-semibold text-foreground">
                  Últimos inventários
                </h2>
                <div className="flex flex-1 flex-wrap items-center justify-end gap-2 lg:max-w-xl">
                  <div className="relative w-full min-w-[12rem] sm:max-w-sm md:w-72">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <input
                      type="search"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Pesquisar em inventário…"
                      aria-label="Pesquisar inventários"
                      className="w-full rounded-full border border-transparent bg-background py-2 pl-10 pr-4 text-body-md text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Filtros"
                    className="border-outline-variant shrink-0"
                    onClick={filtros}
                  >
                    <Filter aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Exportar"
                    className="border-outline-variant shrink-0"
                    onClick={exportar}
                  >
                    <Download aria-hidden />
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="border-b border-outline-variant bg-surface-high/50">
                    <tr>
                      {TABLE_HEADERS.map((header, idx) => {
                        const acuraciaCol = idx === 4;
                        const acoesCol = idx === TABLE_HEADERS.length - 1;
                        return (
                          <th
                            key={header}
                            className={cn(
                              'px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-label-md md:font-semibold',
                              acuraciaCol && 'text-center',
                              acoesCol && 'text-right',
                            )}
                          >
                            {header}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {inventarios.map((row) => (
                      <InventarioRow key={row.id} item={row} />
                    ))}
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
                />
              ) : (
                <p className="px-6 py-16 text-center text-body-md text-muted-foreground">
                  Nenhum inventário encontrado para os filtros aplicados.
                </p>
              )}
            </div>

            <InventarioTrendChart meses={trendMensal} />
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
