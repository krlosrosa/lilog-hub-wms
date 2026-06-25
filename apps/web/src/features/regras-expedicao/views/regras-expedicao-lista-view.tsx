'use client';

import Link from 'next/link';

import { Button } from '@lilog/ui';
import { Plus, SearchX, Timer } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import { RegrasProdutividadeFiltros } from '@/features/config-operacional/components/regras-produtividade-filtros';
import { RegrasProdutividadeStatsCards } from '@/features/config-operacional/components/regras-produtividade-stats';
import { RegraExpedicaoRow } from '@/features/regras-expedicao/components/regra-expedicao-row';
import { useRegrasExpedicaoLista } from '@/features/regras-expedicao/hooks/use-regras-expedicao-lista';

const BASE_PATH = '/config-operacional/regras-separacao';

const TABLE_HEADERS = [
  { label: 'Perfil', className: 'min-w-[180px]' },
  { label: 'Tempo base', className: 'hidden sm:table-cell w-[140px]' },
  { label: 'Status', className: 'w-[90px]' },
  { label: 'Padrão', className: 'hidden md:table-cell w-[90px]' },
  { label: '', className: 'w-16 text-right' },
] as const;

export function RegrasExpedicaoListaView() {
  const {
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
    calcularPreview,
  } = useRegrasExpedicaoLista();

  const temFiltrosAtivos = filtroAtivo !== 'todos' || busca.trim().length > 0;
  const listaVazia = itemsPagina.length === 0;

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <Timer className="size-5" aria-hidden />
                </span>
                <span className="text-caption font-bold uppercase tracking-widest text-primary">
                  Configurações · Separação
                </span>
              </div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Regras de produtividade
              </h1>
              <p className="mt-1 max-w-xl text-body-md text-muted-foreground">
                Defina quanto tempo cada operador deveria levar para executar um mapa de
                separação — deslocamento, pegada de caixas e gordura de início/fim.
              </p>
            </div>

            <Button size="sm" className="gap-1.5 self-start sm:self-auto" asChild>
              <Link href={`${BASE_PATH}/nova`}>
                <Plus className="size-4" aria-hidden />
                Nova regra
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-5 md:gap-6">
            <RegrasProdutividadeStatsCards stats={stats} metaLabel="Meta de tempo por mapa" />

            <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
              <div className="border-b border-outline-variant bg-surface-low/30 px-4 py-4 md:px-6">
                <RegrasProdutividadeFiltros
                  busca={busca}
                  onBuscaChange={setBusca}
                  filtroAtivo={filtroAtivo}
                  onFiltroAtivoChange={setFiltroAtivo}
                  totalFiltrados={totalFiltrados}
                />
              </div>

              {listaVazia ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <SearchX className="mb-3 size-10 text-muted-foreground/50" aria-hidden />
                  <p className="text-sm font-medium text-foreground">
                    Nenhuma regra encontrada
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {temFiltrosAtivos
                      ? 'Tente ajustar os filtros ou a busca.'
                      : 'Crie o primeiro perfil de produtividade.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className={compactTableClassName}>
                      <thead>
                        <tr className={compactTableHeadRowClassName}>
                          {TABLE_HEADERS.map(({ label, className }) => (
                            <th
                              key={label || 'actions'}
                              className={`${compactTableHeadCellClassName} ${className}`}
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={compactTableBodyClassName}>
                        {itemsPagina.map((regra) => (
                          <RegraExpedicaoRow
                            key={regra.id}
                            regra={regra}
                            tempoPreviewSeg={calcularPreview(regra)}
                            onToggleAtivo={toggleAtivo}
                            onDuplicar={duplicarRegra}
                            onExcluir={excluirRegra}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPaginas > 1 && (
                    <div className="border-t border-outline-variant px-4 py-3 md:px-6">
                      <Pagination
                        pagina={pagina}
                        totalPaginas={totalPaginas}
                        onChangePagina={setPagina}
                        totalFiltrados={totalFiltrados}
                        itemsInicio={itemsInicio}
                        pageSize={pageSize}
                        resourceLabelPlural="regras"
                      />
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
