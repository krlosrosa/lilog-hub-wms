'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@lilog/ui';
import { Building2, Loader2, Plus, SearchX } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import { TransportadoraCadastroRapidoDialog } from '@/features/transporte/components/transportadora-cadastro-rapido-dialog';
import { TransportadoraFiltros } from '@/features/transporte/components/transportadora-filtros';
import { TransportadoraFormDialog } from '@/features/transporte/components/transportadora-form-dialog';
import { TransportadoraRow } from '@/features/transporte/components/transportadora-row';
import { TransportadoraStatsCards } from '@/features/transporte/components/transportadora-stats-cards';
import { useTransportadoras } from '@/features/transporte/hooks/use-transportadoras';

const TABLE_HEADERS = [
  { label: 'ID Ravex', className: 'w-[120px]' },
  { label: 'Transportadora', className: 'min-w-[200px]' },
  { label: 'CNPJ', className: 'hidden w-[160px] md:table-cell' },
  { label: 'Veículos', className: 'hidden w-[90px] text-right lg:table-cell' },
  { label: 'Status', className: 'w-[100px]' },
  { label: '', className: 'w-16 text-right' },
] as const;

export function TransportadorasView() {
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
    isLoading,
    isSubmitting,
    isSearchingRavex,
    formDialog,
    deleteDialog,
    cadastroRapidoOpen,
    openCreateDialog,
    openEditDialog,
    closeFormDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openCadastroRapidoDialog,
    closeCadastroRapidoDialog,
    salvarTransportadora,
    confirmarExclusao,
    buscarRavex,
    confirmarCadastroRavex,
  } = useTransportadoras();

  const temFiltrosAtivos =
    filtroStatus !== 'todos' || busca.trim().length > 0;
  const listaVazia = itemsPagina.length === 0;

  return (
    <SidebarMain>
      <TransportadoraCadastroRapidoDialog
        open={cadastroRapidoOpen}
        isSearching={isSearchingRavex}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            closeCadastroRapidoDialog();
          }
        }}
        onBuscar={buscarRavex}
        onConfirmar={confirmarCadastroRavex}
      />

      <TransportadoraFormDialog
        open={formDialog.open}
        editingItem={formDialog.editingItem}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            closeFormDialog();
          }
        }}
        onSubmit={salvarTransportadora}
      />

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            closeDeleteDialog();
          }
        }}
      >
        <AlertDialogContent className="border-outline-variant bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Excluir transportadora?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta ação não pode ser desfeita. A transportadora{' '}
              <span className="font-semibold text-foreground">
                {deleteDialog.target?.nome}
              </span>{' '}
              será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={confirmarExclusao}
            >
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <Building2 className="size-5" aria-hidden />
                </span>
                <span className="text-caption font-bold uppercase tracking-widest text-primary">
                  Transporte
                </span>
              </div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Transportadoras
              </h1>
              <p className="mt-1 max-w-xl text-body-md text-muted-foreground">
                Visão geral das transportadoras parceiras, integração Ravex e
                frota vinculada a cada operador.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-outline-variant"
                onClick={openCadastroRapidoDialog}
              >
                Cadastro rápido Ravex
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={openCreateDialog}
              >
                <Plus className="size-4" aria-hidden />
                Nova transportadora
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-5 md:gap-6">
            <TransportadoraStatsCards
              total={stats.total}
              ativas={stats.ativas}
              inativas={stats.inativas}
              totalVeiculos={stats.totalVeiculos}
            />

            <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
              <div className="border-b border-outline-variant bg-surface-low/30 px-4 py-4 md:px-6">
                <TransportadoraFiltros
                  embedded
                  busca={busca}
                  onBuscaChange={setBusca}
                  filtroStatus={filtroStatus}
                  onFiltroStatusChange={setFiltroStatus}
                  totalFiltrados={totalFiltrados}
                />
              </div>

              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-16 text-body-md text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                    Carregando transportadoras…
                  </div>
                ) : (
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
                                <Building2 className="size-7" aria-hidden />
                              )}
                            </div>
                            <div className="max-w-sm space-y-1">
                              <p className="text-title-md font-semibold text-foreground">
                                {temFiltrosAtivos
                                  ? 'Nenhuma transportadora encontrada'
                                  : 'Nenhuma transportadora cadastrada'}
                              </p>
                              <p className="text-body-md text-muted-foreground">
                                {temFiltrosAtivos
                                  ? 'Ajuste os filtros ou a busca para ver outros resultados.'
                                  : 'Cadastre a primeira transportadora para começar.'}
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
                              <Button
                                size="sm"
                                className="gap-1.5"
                                onClick={openCreateDialog}
                              >
                                <Plus className="size-4" aria-hidden />
                                Nova transportadora
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      itemsPagina.map((transportadora) => (
                        <TransportadoraRow
                          key={transportadora.id}
                          transportadora={transportadora}
                          onEditar={openEditDialog}
                          onExcluir={openDeleteDialog}
                        />
                      ))
                    )}
                  </tbody>
                </table>
                )}
              </div>

              {!isLoading && totalFiltrados > 0 ? (
                <Pagination
                  pagina={pagina}
                  totalPaginas={totalPaginas}
                  onChangePagina={setPagina}
                  totalFiltrados={totalFiltrados}
                  itemsInicio={itemsInicio}
                  pageSize={pageSize}
                  resourceLabelPlural="transportadoras"
                />
              ) : null}
            </section>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
