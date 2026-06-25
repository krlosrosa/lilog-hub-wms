'use client';

import Link from 'next/link';

import { Button } from '@lilog/ui';
import { BookOpen, Plus, SearchX, ScrollText } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import { RegraWmsRow } from '@/features/regras-wms/components/regra-wms-row';
import { RegrasWmsFiltros } from '@/features/regras-wms/components/regras-wms-filtros';
import { RegrasWmsStatsCards } from '@/features/regras-wms/components/regras-wms-stats';
import { useRegrasWmsLista } from '@/features/regras-wms/hooks/use-regras-wms-lista';

const TABLE_HEADERS = [
  { label: 'Regra', className: 'min-w-[180px]' },
  { label: 'Gatilho', className: 'w-[110px]' },
  { label: 'Condições', className: 'hidden lg:table-cell min-w-[200px]' },
  { label: 'Ação', className: 'hidden md:table-cell w-[140px]' },
  { label: 'Prior.', className: 'hidden sm:table-cell w-[60px]' },
  { label: 'Status', className: 'w-[90px]' },
  { label: '', className: 'w-16 text-right' },
] as const;

export function RegrasWmsListaView() {
  const {
    filtroGatilho,
    setFiltroGatilho,
    filtroAtivo,
    setFiltroAtivo,
    busca,
    setBusca,
    pagina,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados,
    pageSize,
    stats,
    toggleAtivo,
    duplicarRegra,
    excluirRegra,
  } = useRegrasWmsLista();

  const temFiltrosAtivos =
    filtroGatilho !== 'todos' ||
    filtroAtivo !== 'todos' ||
    busca.trim().length > 0;
  const listaVazia = itemsPagina.length === 0;

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <ScrollText className="size-5" aria-hidden />
                </span>
                <span className="text-caption font-bold uppercase tracking-widest text-primary">
                  Operações WMS
                </span>
              </div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Regras de automação
              </h1>
              <p className="mt-1 max-w-xl text-body-md text-muted-foreground">
                Configure regras com múltiplas condições para automatizar
                movimentações, quarentena, alertas e reposição no armazém.
              </p>
            </div>

            <Button size="sm" className="gap-1.5 self-start sm:self-auto" asChild>
              <Link href="/regras-wms/nova">
                <Plus className="size-4" aria-hidden />
                Nova regra
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-5 md:gap-6">
            <RegrasWmsStatsCards stats={stats} />

            <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
              <div className="border-b border-outline-variant bg-surface-low/30 px-4 py-4 md:px-6">
                <RegrasWmsFiltros
                  embedded
                  busca={busca}
                  onBuscaChange={setBusca}
                  filtroGatilho={filtroGatilho}
                  onFiltroGatilhoChange={setFiltroGatilho}
                  filtroAtivo={filtroAtivo}
                  onFiltroAtivoChange={setFiltroAtivo}
                  totalFiltrados={totalFiltrados}
                />
              </div>

              <div className="overflow-x-auto">
                <table className={compactTableClassName}>
                  <thead>
                    <tr className={compactTableHeadRowClassName}>
                      {TABLE_HEADERS.map((col) => (
                        <th
                          key={col.label || 'actions'}
                          className={compactTableHeadCellClassName(col.className)}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={compactTableBodyClassName}>
                    {listaVazia ? (
                      <tr>
                        <td colSpan={TABLE_HEADERS.length} className="px-4 py-16">
                          <div className="flex flex-col items-center justify-center gap-4 text-center">
                            <div className="flex size-14 items-center justify-center rounded-full bg-surface-highest text-muted-foreground">
                              {temFiltrosAtivos ? (
                                <SearchX className="size-7" aria-hidden />
                              ) : (
                                <BookOpen className="size-7" aria-hidden />
                              )}
                            </div>
                            <div className="max-w-sm space-y-1">
                              <p className="text-title-md font-semibold text-foreground">
                                {temFiltrosAtivos
                                  ? 'Nenhuma regra encontrada'
                                  : 'Nenhuma regra cadastrada'}
                              </p>
                              <p className="text-body-md text-muted-foreground">
                                {temFiltrosAtivos
                                  ? 'Ajuste os filtros ou a busca para ver outros resultados.'
                                  : 'Crie a primeira regra para automatizar operações do WMS.'}
                              </p>
                            </div>
                            {temFiltrosAtivos ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setBusca('');
                                  setFiltroGatilho('todos');
                                  setFiltroAtivo('todos');
                                }}
                              >
                                Limpar filtros
                              </Button>
                            ) : (
                              <Button size="sm" className="gap-1.5" asChild>
                                <Link href="/regras-wms/nova">
                                  <Plus className="size-4" aria-hidden />
                                  Nova regra
                                </Link>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      itemsPagina.map((regra) => (
                        <RegraWmsRow
                          key={regra.id}
                          regra={regra}
                          onToggleAtivo={toggleAtivo}
                          onDuplicar={duplicarRegra}
                          onExcluir={excluirRegra}
                        />
                      ))
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
                  resourceLabelPlural="regras"
                />
              ) : null}
            </section>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
