'use client';

import { useCallback, useState } from 'react';

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
} from '@lilog/ui';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { SidebarMain } from '@/components/layout/sidebar';

import { FilialRow } from '@/features/filiais/components/filial-row';
import { Pagination } from '@/features/filiais/components/pagination';
import { StatsCards } from '@/features/filiais/components/stats-cards';
import { UtilityBar } from '@/features/filiais/components/utility-bar';
import { useFilialLista } from '@/features/filiais/hooks/use-filiais-lista';

import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';

import type { FilialListaItem } from '@/features/filiais/types/filial-lista.schema';

const TABLE_HEADERS = [
  { label: 'ID', className: 'w-20' },
  { label: 'Unidade', className: 'min-w-[120px]' },
  { label: 'Filial', className: 'hidden md:table-cell' },
  { label: 'Cluster', className: 'hidden lg:table-cell w-24' },
  { label: 'Centros', className: 'hidden sm:table-cell w-20' },
  { label: '', className: 'w-8 text-right' },
] as const;

export function FilialListaView() {
  const {
    filtroCluster,
    setFiltroCluster,
    busca,
    setBusca,
    pagina,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados,
    stats,
    pageSize,
    removerFilial,
    carregando,
    erro,
  } = useFilialLista();

  const [filialParaExcluir, setFilialParaExcluir] =
    useState<FilialListaItem | null>(null);

  const [excluindoDaLista, setExcluindoDaLista] = useState(false);

  const iniciarExclusaoNaLista = useCallback((filial: FilialListaItem) => {
    setFilialParaExcluir(filial);
  }, []);

  const confirmarExclusaoNaLista = useCallback(async () => {
    const alvo = filialParaExcluir;
    if (!alvo) {
      return;
    }

    setExcluindoDaLista(true);

    try {
      await removerFilial(alvo.id);
      setFilialParaExcluir(null);
    } catch {
      // toast handled in hook
    } finally {
      setExcluindoDaLista(false);
    }
  }, [filialParaExcluir, removerFilial]);

  function handleExportar() {
    toast.success('Exportação iniciada.', { duration: 2000 });
  }

  const dialogAberto = filialParaExcluir !== null;

  return (
    <SidebarMain>
      <AlertDialog
        open={dialogAberto}
        onOpenChange={(aberto) => {
          if (!aberto && !excluindoDaLista) {
            setFilialParaExcluir(null);
          }
        }}
      >
        <AlertDialogContent className="border-outline-variant bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Excluir unidade?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {filialParaExcluir ? (
                <>
                  A unidade{' '}
                  <span className="font-medium text-foreground">
                    {filialParaExcluir.nome}
                  </span>{' '}
                  ({filialParaExcluir.id}) será removida permanentemente.
                </>
              ) : (
                ''
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={excluindoDaLista}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={excluindoDaLista}
              onClick={() => void confirmarExclusaoNaLista()}
            >
              {excluindoDaLista ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Excluindo…
                </>
              ) : (
                'Excluir unidade'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="px-margin-mobile py-8 md:px-margin-desktop">
        <div className="mx-auto max-w-container">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-headline-lg font-semibold text-foreground tracking-tight">
                Gestão de Unidades
              </h1>
              <p className="mt-1 text-body-md text-muted-foreground">
                Gerencie unidades, filiais e centros operacionais.
              </p>
            </div>

            <Button asChild>
              <Link href="/unidades/nova" className="flex items-center gap-2">
                <Plus className="size-4" aria-hidden />
                Nova Unidade
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-10">
            <UtilityBar
              filtroCluster={filtroCluster}
              onFiltroChange={setFiltroCluster}
              busca={busca}
              onBuscaChange={setBusca}
              onExportar={handleExportar}
            />

            <div className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg backdrop-blur-glass shadow-inner-glow">
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
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                            Carregando unidades…
                          </span>
                        </td>
                      </tr>
                    ) : itemsPagina.length > 0 ? (
                      itemsPagina.map((filial) => (
                        <FilialRow
                          key={filial.id}
                          filial={filial}
                          onExcluir={iniciarExclusaoNaLista}
                        />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={TABLE_HEADERS.length}
                          className={compactTableEmptyCellClassName}
                        >
                          {erro ??
                            'Nenhuma unidade encontrada para os filtros aplicados.'}
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
              />
            </div>

            <StatsCards
              total={stats.total}
              totalCentros={stats.totalCentros}
              porCluster={stats.porCluster}
            />
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
