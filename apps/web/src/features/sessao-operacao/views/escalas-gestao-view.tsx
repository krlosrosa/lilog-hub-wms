'use client';

import { Button } from '@lilog/ui';
import { CalendarClock, Loader2, Plus, SearchX } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import { EscalaFormDialog } from '@/features/sessao-operacao/components/escala-form-dialog';
import { EscalaFuncionariosPanel } from '@/features/sessao-operacao/components/escala-funcionarios-panel';
import { EscalaTableRow } from '@/features/sessao-operacao/components/escala-table-row';
import { useEscalasGestao } from '@/features/sessao-operacao/hooks/use-escalas-gestao';

const TABLE_HEADERS = [
  { label: 'Escala', className: 'min-w-[180px]' },
  { label: 'Equipe', className: 'hidden min-w-[160px] md:table-cell' },
  { label: 'Horário', className: 'min-w-[160px]' },
  { label: 'Área', className: 'hidden min-w-[120px] lg:table-cell' },
  { label: 'Funcionários', className: 'w-[120px]' },
  { label: 'Status', className: 'w-[100px]' },
] as const;

export function EscalasGestaoView() {
  const {
    unidadeId,
    escalas,
    total,
    pagina,
    setPagina,
    totalPaginas,
    isLoading,
    isSubmitting,
    formOpen,
    selectedEscala,
    panelOpen,
    openCreateDialog,
    closeCreateDialog,
    openEscalaPanel,
    setPanelOpen,
    salvarEscala,
    reloadEscalas,
  } = useEscalasGestao();

  const listaVazia = !isLoading && escalas.length === 0;

  return (
    <SidebarMain>
      <EscalaFormDialog
        open={formOpen}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            closeCreateDialog();
          }
        }}
        onSubmit={salvarEscala}
      />

      <EscalaFuncionariosPanel
        escala={selectedEscala}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onChanged={() => void reloadEscalas()}
      />

      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <CalendarClock className="size-5" aria-hidden />
              <span className="text-label-md font-bold uppercase tracking-wide">
                Sessão Operação
              </span>
            </div>
            <h1 className="text-headline-sm font-bold text-foreground">
              Escalas de Trabalho
            </h1>
            <p className="mt-1 text-body-sm text-muted-foreground">
              Cadastre escalas, equipes e vincule funcionários antes de abrir sessões.
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreateDialog}
            disabled={!unidadeId || isSubmitting}
          >
            <Plus className="size-4" aria-hidden />
            Nova escala
          </Button>
        </div>

        {!unidadeId && (
          <div className="rounded-xl border border-dashed border-outline-variant bg-card p-6 text-body-sm text-muted-foreground">
            Selecione uma unidade para gerenciar escalas.
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-outline-variant bg-card">
          <table className={compactTableClassName}>
            <thead>
              <tr className={compactTableHeadRowClassName}>
                {TABLE_HEADERS.map((header) => (
                  <th
                    key={header.label}
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
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    <Loader2 className="mx-auto size-6 animate-spin" />
                  </td>
                </tr>
              ) : listaVazia ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <SearchX className="size-8" aria-hidden />
                      <p className="text-body-sm">Nenhuma escala cadastrada.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                escalas.map((escala) => (
                  <EscalaTableRow
                    key={escala.id}
                    escala={escala}
                    isSelected={selectedEscala?.id === escala.id}
                    onSelect={openEscalaPanel}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <Pagination
            pagina={pagina}
            totalPaginas={totalPaginas}
            onChangePagina={setPagina}
            totalFiltrados={total}
            itemsInicio={(pagina - 1) * 20 + (escalas.length > 0 ? 1 : 0)}
            pageSize={20}
            resourceLabelPlural="escalas"
          />
        )}
      </div>
    </SidebarMain>
  );
}
