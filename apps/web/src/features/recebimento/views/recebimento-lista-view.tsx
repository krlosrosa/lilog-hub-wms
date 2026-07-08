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
import { Loader2, PackageOpen, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';

import { Pagination } from '@/features/filiais/components/pagination';
import { DocasControl } from '@/features/recebimento/components/docas-control';
import { RecebimentoFiltrosAvancadosSheet } from '@/features/recebimento/components/recebimento-filtros-avancados-sheet';
import { RecebimentoRow } from '@/features/recebimento/components/recebimento-row';
import { RecebimentoStatsCards } from '@/features/recebimento/components/recebimento-stats-cards';
import { RecebimentoUtilityBar } from '@/features/recebimento/components/recebimento-utility-bar';
import { useRecebimentoLista } from '@/features/recebimento/hooks/use-recebimento-lista';
import type { RecebimentoListaItem } from '@/features/recebimento/types/recebimento-lista.schema';

const TABLE_HEADERS = [
  { label: 'Placa', className: 'min-w-[100px]' },
  { label: 'Transportador', className: 'hidden min-w-[90px] sm:table-cell' },
  { label: 'Horário', className: 'w-[88px]' },
  { label: 'Empresa', className: 'hidden text-right md:table-cell' },
  { label: 'Status', className: 'w-[100px]' },
  { label: '', className: 'w-16 text-right' },
] as const;

export function RecebimentoListaView() {
  const {
    isLoading,
    isSubmitting,
    docas,
    filtroTurno,
    setFiltroTurno,
    filtrosAvancados,
    filtrosAvancadosAtivos,
    setFiltrosAvancados,
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
    cancelarRecebimento,
  } = useRecebimentoLista();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recebimentoParaExcluir, setRecebimentoParaExcluir] =
    useState<RecebimentoListaItem | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [filtrosSheetAberto, setFiltrosSheetAberto] = useState(false);

  const exportar = useCallback(() => {
    toast.success('Exportação simulada (mock)', {
      description: 'O arquivo será gerado em instantes nos fluxos produtivos.',
    });
  }, []);

  const iniciarExclusao = useCallback((r: RecebimentoListaItem) => {
    setRecebimentoParaExcluir(r);
  }, []);

  const confirmarExclusao = useCallback(async () => {
    const alvo = recebimentoParaExcluir;
    if (!alvo) {
      return;
    }

    setExcluindo(true);
    try {
      await cancelarRecebimento(alvo.id);
      if (selectedId === alvo.id) {
        setSelectedId(null);
      }
      setRecebimentoParaExcluir(null);
    } catch {
      // Erro já exibido pelo hook
    } finally {
      setExcluindo(false);
    }
  }, [cancelarRecebimento, recebimentoParaExcluir, selectedId]);

  const dialogAberto = recebimentoParaExcluir !== null;

  return (
    <SidebarMain>
      <AlertDialog
        open={dialogAberto}
        onOpenChange={(aberto) => {
          if (!aberto && !excluindo) {
            setRecebimentoParaExcluir(null);
          }
        }}
      >
        <AlertDialogContent className="border-outline-variant bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Cancelar pré-recebimento?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {recebimentoParaExcluir ? (
                <>
                  O agendamento será cancelado na API. Veículo{' '}
                  <span className="font-semibold text-foreground">
                    {recebimentoParaExcluir.placa}
                  </span>{' '}
                  ({recebimentoParaExcluir.transportador}).
                </>
              ) : (
                ''
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              type="button"
              disabled={excluindo || isSubmitting}
            >
              Voltar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={excluindo || isSubmitting}
              onClick={() => void confirmarExclusao()}
            >
              {excluindo || isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Cancelando…
                </>
              ) : (
                'Confirmar cancelamento'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="px-margin-mobile py-5 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4">
          <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <PackageOpen className="size-4" aria-hidden />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Entrada
                </span>
              </div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Recebimentos previstos
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground md:text-body-md">
                Fluxo de entrada e logística de docas.
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="shrink-0 gap-1.5 self-start sm:self-auto"
            >
              <Link href="/recebimento/novo">
                <Plus className="size-4 shrink-0" aria-hidden />
                Novo recebimento
              </Link>
            </Button>
          </header>

          <RecebimentoStatsCards
            hoje={stats.hoje}
            volumeEsperado={stats.volumeEsperado}
            docasOcupadas={stats.docasOcupadas}
            docasTotal={stats.docasTotal}
            atrasos={stats.atrasos}
          />

          <div className="grid gap-4 xl:grid-cols-[1fr_minmax(220px,280px)] xl:items-start">
            <div className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
              <div className="border-b border-outline-variant bg-surface-low/30 px-3 py-2">
                <RecebimentoUtilityBar
                  embedded
                  filtroTurno={filtroTurno}
                  onTurnoChange={setFiltroTurno}
                  busca={busca}
                  onBuscaChange={setBusca}
                  onFiltrosAvancados={() => setFiltrosSheetAberto(true)}
                  filtrosAvancadosAtivos={filtrosAvancadosAtivos}
                  onExportar={exportar}
                />
              </div>

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
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={TABLE_HEADERS.length}
                          className={compactTableEmptyCellClassName}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Loader2
                              className="size-4 animate-spin"
                              aria-hidden
                            />
                            Carregando recebimentos…
                          </span>
                        </td>
                      </tr>
                    ) : itemsPagina.length ? (
                      itemsPagina.map((r) => (
                        <RecebimentoRow
                          key={r.id}
                          recebimento={r}
                          detailHref={`/recebimento/${r.id}`}
                          selecionado={selectedId === r.id}
                          onSelecionar={(rcv) =>
                            setSelectedId(
                              rcv.id === selectedId ? null : rcv.id,
                            )
                          }
                          onExcluir={iniciarExclusao}
                        />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={TABLE_HEADERS.length}
                          className={compactTableEmptyCellClassName}
                        >
                          Nenhum recebimento encontrado para os filtros aplicados.
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
                resourceLabelPlural="recebimentos"
              />
            </div>

            <DocasControl docas={docas} compact />
          </div>
        </div>
      </main>

      <RecebimentoFiltrosAvancadosSheet
        open={filtrosSheetAberto}
        onOpenChange={setFiltrosSheetAberto}
        filtros={filtrosAvancados}
        onAplicar={setFiltrosAvancados}
      />
    </SidebarMain>
  );
}
