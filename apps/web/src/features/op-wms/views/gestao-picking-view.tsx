'use client';

import { Download, Filter, Loader2, Search } from 'lucide-react';
import Link from 'next/link';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { PickingKpiCard } from '@/features/op-wms/components/picking-kpi-card';
import { ReplenishmentTable } from '@/features/op-wms/components/replenishment-table';
import { useGestaoPicking } from '@/features/op-wms/hooks/use-gestao-picking';

const searchInputClassName =
  'w-full rounded-lg border border-outline-variant bg-surface-lowest py-1 pl-8 pr-4 text-caption text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-0 md:w-64';

export function GestaoPickingView() {
  const {
    isLoading,
    kpis,
    items,
    filteredCount,
    totalRecords,
    search,
    onlyCritical,
    page,
    totalPages,
    generatingIds,
    setSearch,
    setOnlyCritical,
    setPage,
    generateMission,
    viewPulmao,
    exportData,
    openAdvancedFilters,
  } = useGestaoPicking();

  return (
    <SidebarMain>
      <main className="relative min-h-dvh">
        <div className="space-y-gutter px-margin-mobile py-4 md:px-margin-desktop md:py-5">
          <div className="mx-auto max-w-container space-y-gutter">
            <header className="flex flex-wrap items-end justify-between gap-gutter border-b border-outline-variant pb-gutter">
              <div>
                <nav className="mb-1 flex gap-2 text-caption text-muted-foreground">
                  <Link href="/op-wms" className="hover:text-primary">
                    Warehouse
                  </Link>
                  <span aria-hidden>/</span>
                  <span>Operações</span>
                  <span aria-hidden>/</span>
                  <span className="text-primary">Replenishment</span>
                </nav>
                <h1 className="text-headline-lg-mobile font-semibold text-foreground md:text-headline-lg">
                  Gestão de Reabastecimento de Picking
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-gutter">
                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={onlyCritical}
                    onChange={(event) => setOnlyCritical(event.target.checked)}
                  />
                  <span
                    className={cn(
                      'relative h-6 w-11 rounded-full bg-surface-highest transition-colors',
                      'after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-outline-variant after:bg-background after:transition-transform',
                      'peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
                    )}
                    aria-hidden
                  />
                  <span className="ml-3 text-caption text-muted-foreground">
                    Only Critical/Rupture
                  </span>
                </label>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={openAdvancedFilters}
                >
                  <Filter className="h-4 w-4" aria-hidden />
                  Filtros Avançados
                </Button>
              </div>
            </header>

            {isLoading ? (
              <div
                className="flex min-h-[320px] items-center justify-center"
                role="status"
                aria-label="Carregando gestão de picking"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <section className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-4">
                  {kpis.map((kpi) => (
                    <PickingKpiCard key={kpi.id} kpi={kpi} />
                  ))}
                </section>

                <section className="overflow-hidden rounded-lg border border-outline-variant bg-card shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-gutter border-b border-outline-variant bg-surface-high px-gutter py-3">
                    <h2 className="text-label-md font-medium text-primary">
                      Necessidade de Reposição
                    </h2>
                    <div className="flex items-center gap-gutter">
                      <div className="relative">
                        <Search
                          className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                          aria-hidden
                        />
                        <input
                          type="search"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Buscar SKU ou Endereço..."
                          className={searchInputClassName}
                          aria-label="Buscar SKU ou endereço"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={exportData}
                        aria-label="Exportar dados"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <ReplenishmentTable
                    items={items}
                    filteredCount={filteredCount}
                    totalRecords={totalRecords}
                    page={page}
                    totalPages={totalPages}
                    generatingIds={generatingIds}
                    onGenerateMission={generateMission}
                    onViewPulmao={viewPulmao}
                    onPageChange={setPage}
                  />
                </section>
              </>
            )}
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
