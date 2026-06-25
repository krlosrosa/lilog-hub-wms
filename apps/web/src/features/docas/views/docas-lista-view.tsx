'use client';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import { ChevronRight, Loader2, Plus } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import { DocaActionDialogs } from '@/features/docas/components/doca-action-dialogs';
import { DocaFiltros } from '@/features/docas/components/doca-filtros';
import { DocaOperacoesAtivas } from '@/features/docas/components/doca-operacoes-ativas';
import { DocaRow } from '@/features/docas/components/doca-row';
import { DocaStatsCards } from '@/features/docas/components/doca-stats-cards';
import { DocaUtilizacaoChart } from '@/features/docas/components/doca-utilizacao-chart';
import { useDocasLista } from '@/features/docas/hooks/use-docas-lista';

const TABLE_HEADERS = [
  { label: 'Doca', className: 'w-[28%]' },
  { label: 'Tipo', className: 'w-[18%]' },
  { label: 'Cap.', className: 'w-[10%] text-right' },
  { label: 'Situação', className: 'w-[16%]' },
  { label: 'Unidade', className: 'hidden w-[18%] lg:table-cell' },
  { label: '', className: 'w-10 text-right' },
] as const;

export function DocasListaView() {
  const {
    isLoading,
    isSubmitting,
    operacoesAtivas,
    stats,
    filtroSituacao,
    setFiltroSituacao,
    filtroTipo,
    setFiltroTipo,
    busca,
    setBusca,
    pagina,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados,
    pageSize,
    dialogState,
    closeDialog,
    openBlockDialog,
    openUnblockDialog,
    openMaintenanceDialog,
    openDeleteDialog,
    confirmBlock,
    confirmUnblock,
    confirmMaintenance,
    confirmDelete,
    turnosUtilizacao,
  } = useDocasLista();

  return (
    <SidebarMain>
      <DocaActionDialogs
        dialogState={dialogState}
        isSubmitting={isSubmitting}
        onClose={closeDialog}
        onConfirmBlock={confirmBlock}
        onConfirmUnblock={confirmUnblock}
        onConfirmMaintenance={confirmMaintenance}
        onConfirmDelete={confirmDelete}
      />

      <main className="px-margin-mobile py-5 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4">
          <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <nav
                aria-label="Breadcrumb"
                className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground"
              >
                <span>WMS</span>
                <ChevronRight className="size-3" aria-hidden />
                <span className="text-primary">Docas</span>
              </nav>
              <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                Gestão de Docas
              </h1>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 gap-1.5 self-start sm:self-auto"
              asChild
            >
              <Link href="/docas/novo">
                <Plus className="size-3.5 shrink-0" aria-hidden />
                Nova Doca
              </Link>
            </Button>
          </header>

          <DocaStatsCards {...stats} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass xl:col-span-8">
              <DocaFiltros
                embedded
                busca={busca}
                onBuscaChange={setBusca}
                filtroSituacao={filtroSituacao}
                onFiltroSituacaoChange={setFiltroSituacao}
                filtroTipo={filtroTipo}
                onFiltroTipoChange={setFiltroTipo}
              />

              <div className="overflow-x-auto">
                <table className={cn(compactTableClassName, 'table-fixed')}>
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
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={TABLE_HEADERS.length}
                          className={compactTableEmptyCellClassName}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                            Carregando docas...
                          </span>
                        </td>
                      </tr>
                    ) : itemsPagina.length ? (
                      itemsPagina.map((doca) => (
                        <DocaRow
                          key={doca.id}
                          doca={doca}
                          onBloquear={openBlockDialog}
                          onDesbloquear={openUnblockDialog}
                          onManutencao={openMaintenanceDialog}
                          onExcluir={openDeleteDialog}
                        />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={TABLE_HEADERS.length}
                          className={compactTableEmptyCellClassName}
                        >
                          Nenhuma doca encontrada para os filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                pagina={pagina}
                totalPaginas={totalPaginas}
                onChangePagina={setPagina}
                totalFiltrados={totalFiltrados}
                itemsInicio={itemsInicio}
                pageSize={pageSize}
                resourceLabelPlural="docas"
              />
            </section>

            <aside className="space-y-3 xl:col-span-4">
              <DocaOperacoesAtivas operacoes={operacoesAtivas} />
              <DocaUtilizacaoChart turnos={turnosUtilizacao} />
            </aside>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
