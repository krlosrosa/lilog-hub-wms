'use client';

import { useCallback, useState, type ChangeEvent } from 'react';

import Link from 'next/link';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  cn,
} from '@lilog/ui';
import { ChevronRight, Loader2, Plus, Search } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import { CentroOrigemRow } from '@/features/centros-origem/components/centro-origem-row';
import {
  fieldInputClassName,
} from '@/features/filiais/components/form-field-classes';
import { useCentrosOrigemLista } from '@/features/centros-origem/hooks/use-centros-origem-lista';
import type { CentroOrigemListaItem } from '@/features/centros-origem/types/centro-origem-form.schema';

const TABLE_HEADERS = [
  { label: 'Centro', className: 'w-32' },
  { label: 'Nome', className: 'min-w-[200px]' },
  { label: '', className: 'w-8 text-right' },
] as const;

export function CentrosOrigemListaView() {
  const {
    isLoading,
    isSubmitting,
    busca,
    setBusca,
    pagina,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados,
    pageSize,
    removerCentroOrigem,
  } = useCentrosOrigemLista();

  const [itemParaExcluir, setItemParaExcluir] =
    useState<CentroOrigemListaItem | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const iniciarExclusao = useCallback((item: CentroOrigemListaItem) => {
    setItemParaExcluir(item);
  }, []);

  const confirmarExclusao = useCallback(async () => {
    const alvo = itemParaExcluir;
    if (!alvo) {
      return;
    }

    setExcluindo(true);

    try {
      await removerCentroOrigem(alvo.centro);
      setItemParaExcluir(null);
    } catch {
      // toast handled in hook
    } finally {
      setExcluindo(false);
    }
  }, [itemParaExcluir, removerCentroOrigem]);

  const dialogAberto = itemParaExcluir !== null;

  return (
    <SidebarMain>
      <AlertDialog
        open={dialogAberto}
        onOpenChange={(aberto) => {
          if (!aberto && !excluindo) {
            setItemParaExcluir(null);
          }
        }}
      >
        <AlertDialogContent className="border-outline-variant bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Excluir centro de origem?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {itemParaExcluir ? (
                <>
                  O centro{' '}
                  <span className="font-medium text-foreground">
                    {itemParaExcluir.centro}
                  </span>{' '}
                  ({itemParaExcluir.nome}) será removido permanentemente.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={excluindo || isSubmitting}
              onClick={() => void confirmarExclusao()}
            >
              {excluindo ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Excluindo…
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="px-margin-mobile py-5 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4">
          <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <nav
                aria-label="Breadcrumb"
                className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground"
              >
                <span>Gestão</span>
                <ChevronRight className="size-3" aria-hidden />
                <span className="text-primary">Centros de Origem</span>
              </nav>
              <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                Centros de Origem
              </h1>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 gap-1.5 self-start sm:self-auto"
              asChild
            >
              <Link href="/centros-origem/novo">
                <Plus className="size-3.5 shrink-0" aria-hidden />
                Novo Centro
              </Link>
            </Button>
          </header>

          <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
            <div className="border-b border-outline-variant px-4 py-3">
              <div className="relative max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  placeholder="Buscar por centro ou nome…"
                  value={busca}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setBusca(event.target.value)
                  }
                  className={cn(fieldInputClassName, 'h-9 pl-9')}
                />
              </div>
            </div>

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
                          Carregando centros de origem...
                        </span>
                      </td>
                    </tr>
                  ) : itemsPagina.length ? (
                    itemsPagina.map((item) => (
                      <CentroOrigemRow
                        key={item.centro}
                        item={item}
                        onExcluir={iniciarExclusao}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={TABLE_HEADERS.length}
                        className={compactTableEmptyCellClassName}
                      >
                        Nenhum centro de origem encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              pagina={pagina}
              totalPaginas={totalPaginas}
              itemsInicio={itemsInicio}
              totalFiltrados={totalFiltrados}
              pageSize={pageSize}
              resourceLabelPlural="centros de origem"
              onChangePagina={setPagina}
            />
          </section>
        </div>
      </main>
    </SidebarMain>
  );
}
