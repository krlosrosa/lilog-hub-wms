'use client';

import Link from 'next/link';

import { Button } from '@lilog/ui';
import { CalendarClock, Plus, SearchX, Truck } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import { FrotaListaFiltros } from '@/features/frota/components/frota-lista-filtros';
import { FrotaListaStats } from '@/features/frota/components/frota-lista-stats';
import { VeiculoRow } from '@/features/frota/components/veiculo-row';
import { useFrotaLista } from '@/features/frota/hooks/use-frota-lista';

const TABLE_HEADERS = [
  { label: 'Código', className: 'w-[100px]' },
  { label: 'Veículo', className: 'min-w-[180px]' },
  { label: 'Transportadora', className: 'hidden w-[140px] md:table-cell' },
  { label: 'CD', className: 'hidden lg:table-cell min-w-[120px]' },
  { label: 'Status', className: 'w-[110px]' },
  { label: 'Próx. manutenção', className: 'hidden xl:table-cell w-[130px]' },
  { label: '', className: 'w-16 text-right' },
] as const;

export function FrotaListaView() {
  const {
    filtroStatus,
    setFiltroStatus,
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
  } = useFrotaLista();

  const temFiltrosAtivos =
    filtroStatus !== 'todos' || busca.trim().length > 0;
  const listaVazia = itemsPagina.length === 0;

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <Truck className="size-5" aria-hidden />
                </span>
                <span className="text-caption font-bold uppercase tracking-widest text-primary">
                  Operações
                </span>
              </div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Diretório de frota
              </h1>
              <p className="mt-1 max-w-xl text-body-md text-muted-foreground">
                Consulte veículos, status operacional e acesse manutenções e
                documentação de cada unidade.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-outline-variant"
                asChild
              >
                <Link href="/frota/agenda">
                  <CalendarClock className="size-4" aria-hidden />
                  Agenda e alertas
                </Link>
              </Button>
              <Button size="sm" className="gap-1.5" asChild>
                <Link href="/frota/novo">
                  <Plus className="size-4" aria-hidden />
                  Cadastrar veículo
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-5 md:gap-6">
            <FrotaListaStats
              total={stats.total}
              ativos={stats.ativos}
              bloqueados={stats.bloqueados}
              emManutencao={stats.emManutencao}
            />

            <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
              <div className="border-b border-outline-variant bg-surface-low/30 px-4 py-4 md:px-6">
                <FrotaListaFiltros
                  embedded
                  busca={busca}
                  onBuscaChange={setBusca}
                  filtroStatus={filtroStatus}
                  onFiltroStatusChange={setFiltroStatus}
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
                                <Truck className="size-7" aria-hidden />
                              )}
                            </div>
                            <div className="max-w-sm space-y-1">
                              <p className="text-title-md font-semibold text-foreground">
                                {temFiltrosAtivos
                                  ? 'Nenhum veículo encontrado'
                                  : 'Nenhum veículo cadastrado'}
                              </p>
                              <p className="text-body-md text-muted-foreground">
                                {temFiltrosAtivos
                                  ? 'Ajuste os filtros ou a busca para ver outros resultados.'
                                  : 'Cadastre o primeiro veículo para começar a operar a frota.'}
                              </p>
                            </div>
                            {temFiltrosAtivos ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setBusca('');
                                  setFiltroStatus('todos');
                                }}
                              >
                                Limpar filtros
                              </Button>
                            ) : (
                              <Button size="sm" className="gap-1.5" asChild>
                                <Link href="/frota/novo">
                                  <Plus className="size-4" aria-hidden />
                                  Cadastrar veículo
                                </Link>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      itemsPagina.map((veiculo) => (
                        <VeiculoRow key={veiculo.id} veiculo={veiculo} />
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
                  resourceLabelPlural="veículos"
                />
              ) : null}
            </section>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
