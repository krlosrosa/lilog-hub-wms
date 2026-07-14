'use client';

import { useCallback, useMemo, useState } from 'react';

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
import {
  LayoutDashboard,
  Loader2,
  PackageOpen,
  Plus,
  SearchX,
} from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';

import { Pagination } from '@/features/filiais/components/pagination';
import { DocasControl } from '@/features/recebimento/components/docas-control';
import { ModalGerarMovimentacao } from '@/features/recebimento/components/modal-gerar-movimentacao';
import { ModalReagendarRecebimento } from '@/features/recebimento/components/modal-reagendar-recebimento';
import { RecebimentoFiltrosAvancadosSheet } from '@/features/recebimento/components/recebimento-filtros-avancados-sheet';
import { RecebimentoRow } from '@/features/recebimento/components/recebimento-row';
import { RecebimentoStatsCards } from '@/features/recebimento/components/recebimento-stats-cards';
import { RecebimentoUtilityBar } from '@/features/recebimento/components/recebimento-utility-bar';
import { useRecebimentoLista } from '@/features/recebimento/hooks/use-recebimento-lista';
import { getDefaultRecebimentoFiltrosAvancados } from '@/features/recebimento/types/recebimento-filtros';
import type {
  RecebimentoListaItem,
  RecebimentoStatus,
} from '@/features/recebimento/types/recebimento-lista.schema';

const TABLE_HEADERS = [
  { label: '', className: 'w-8' },
  { label: 'Placa', className: 'min-w-[100px]' },
  { label: 'Transportador', className: 'hidden min-w-[90px] sm:table-cell' },
  { label: 'Transporte', className: 'hidden min-w-[90px] md:table-cell' },
  { label: 'OCR', className: 'hidden min-w-[90px] lg:table-cell' },
  { label: 'Horário', className: 'w-[88px]' },
  { label: 'Empresa', className: 'hidden text-right md:table-cell' },
  { label: 'Status', className: 'w-[100px]' },
  { label: '', className: 'w-16 text-right' },
] as const;

const STATUS_ELEGIVEL_MOVIMENTACAO = new Set<RecebimentoStatus>([
  'em_conferencia',
  'conferido',
  'finalizado',
]);

const STATUS_ELEGIVEL_REAGENDAR = new Set<RecebimentoStatus>(['agendado']);

type GrupoSelecao = 'reagendar' | 'movimentacao' | null;

function podeSelecionarParaMovimentacao(status: RecebimentoStatus): boolean {
  return STATUS_ELEGIVEL_MOVIMENTACAO.has(status);
}

function podeSelecionarParaReagendar(status: RecebimentoStatus): boolean {
  return STATUS_ELEGIVEL_REAGENDAR.has(status);
}

function resolveGrupoSelecao(
  selectedIds: Set<string>,
  recebimentos: RecebimentoListaItem[],
): GrupoSelecao {
  if (selectedIds.size === 0) {
    return null;
  }

  const selecionados = recebimentos.filter((item) => selectedIds.has(item.id));

  if (selecionados.some((item) => podeSelecionarParaReagendar(item.status))) {
    return 'reagendar';
  }

  if (selecionados.some((item) => podeSelecionarParaMovimentacao(item.status))) {
    return 'movimentacao';
  }

  return null;
}

function podeSelecionarItem(
  recebimento: RecebimentoListaItem,
  grupoAtivo: GrupoSelecao,
): boolean {
  const elegivelReagendar = podeSelecionarParaReagendar(recebimento.status);
  const elegivelMovimentacao = podeSelecionarParaMovimentacao(recebimento.status);

  if (!elegivelReagendar && !elegivelMovimentacao) {
    return false;
  }

  if (grupoAtivo === 'reagendar') {
    return elegivelReagendar;
  }

  if (grupoAtivo === 'movimentacao') {
    return elegivelMovimentacao;
  }

  return elegivelReagendar || elegivelMovimentacao;
}

function resolveGrupoParaSelecionarTodos(
  grupoAtivo: GrupoSelecao,
  items: RecebimentoListaItem[],
): GrupoSelecao | null {
  if (grupoAtivo) {
    return grupoAtivo;
  }

  const temAgendado = items.some((item) =>
    podeSelecionarParaReagendar(item.status),
  );
  if (temAgendado) {
    return 'reagendar';
  }

  const temMovimentacao = items.some((item) =>
    podeSelecionarParaMovimentacao(item.status),
  );
  if (temMovimentacao) {
    return 'movimentacao';
  }

  return null;
}

function filtrarItemsPorGrupo(
  items: RecebimentoListaItem[],
  grupo: GrupoSelecao,
): RecebimentoListaItem[] {
  if (grupo === 'reagendar') {
    return items.filter((item) => podeSelecionarParaReagendar(item.status));
  }

  return items.filter((item) => podeSelecionarParaMovimentacao(item.status));
}

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
    itemsFiltrados,
    itemsInicio,
    totalFiltrados,
    stats,
    pageSize,
    setPageSize,
    pageSizeOptions,
    recebimentos,
    cancelarRecebimento,
    reagendarRecebimentos,
  } = useRecebimentoLista();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalMovimentacaoAberto, setModalMovimentacaoAberto] = useState(false);
  const [modalReagendarAberto, setModalReagendarAberto] = useState(false);
  const [recebimentoParaExcluir, setRecebimentoParaExcluir] =
    useState<RecebimentoListaItem | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [filtrosSheetAberto, setFiltrosSheetAberto] = useState(false);

  const selectedIdsArray = useMemo(() => [...selectedIds], [selectedIds]);

  const grupoSelecaoAtivo = useMemo(
    () => resolveGrupoSelecao(selectedIds, recebimentos),
    [recebimentos, selectedIds],
  );

  const idsParaReagendar = useMemo(
    () =>
      selectedIdsArray.filter((id) => {
        const item = recebimentos.find((recebimento) => recebimento.id === id);
        return item ? podeSelecionarParaReagendar(item.status) : false;
      }),
    [recebimentos, selectedIdsArray],
  );

  const idsParaMovimentacao = useMemo(
    () =>
      selectedIdsArray.filter((id) => {
        const item = recebimentos.find((recebimento) => recebimento.id === id);
        return item ? podeSelecionarParaMovimentacao(item.status) : false;
      }),
    [recebimentos, selectedIdsArray],
  );

  const grupoSelecionarTodos = useMemo(
    () => resolveGrupoParaSelecionarTodos(grupoSelecaoAtivo, itemsFiltrados),
    [grupoSelecaoAtivo, itemsFiltrados],
  );

  const itemsSelecionaveisFiltrados = useMemo(
    () =>
      grupoSelecionarTodos
        ? filtrarItemsPorGrupo(itemsFiltrados, grupoSelecionarTodos)
        : [],
    [grupoSelecionarTodos, itemsFiltrados],
  );

  const itemsSelecionaveisPagina = useMemo(
    () =>
      itemsPagina.filter((item) =>
        podeSelecionarItem(item, grupoSelecaoAtivo ?? grupoSelecionarTodos),
      ),
    [grupoSelecaoAtivo, grupoSelecionarTodos, itemsPagina],
  );

  const todosFiltradosSelecionados =
    itemsSelecionaveisFiltrados.length > 0 &&
    itemsSelecionaveisFiltrados.every((item) => selectedIds.has(item.id));

  const todosPaginaSelecionados =
    itemsSelecionaveisPagina.length > 0 &&
    itemsSelecionaveisPagina.every((item) => selectedIds.has(item.id));

  const algunsPaginaSelecionados =
    itemsSelecionaveisPagina.some((item) => selectedIds.has(item.id)) &&
    !todosPaginaSelecionados;

  const temFiltrosAtivos =
    filtroTurno !== 'todos' ||
    busca.trim().length > 0 ||
    filtrosAvancadosAtivos > 0;
  const listaVazia = !isLoading && itemsPagina.length === 0;

  const toggleSelecao = useCallback(
    (recebimento: RecebimentoListaItem) => {
      if (!podeSelecionarItem(recebimento, grupoSelecaoAtivo)) {
        return;
      }

      setSelectedIds((atual) => {
        const proximo = new Set(atual);

        if (proximo.has(recebimento.id)) {
          proximo.delete(recebimento.id);
        } else {
          proximo.add(recebimento.id);
        }

        return proximo;
      });
    },
    [grupoSelecaoAtivo],
  );

  const selecionarTodosFiltrados = useCallback(() => {
    if (!grupoSelecionarTodos) {
      return;
    }

    setSelectedIds(
      new Set(itemsSelecionaveisFiltrados.map((item) => item.id)),
    );
  }, [grupoSelecionarTodos, itemsSelecionaveisFiltrados]);

  const limparSelecao = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleTodosPagina = useCallback(() => {
    const grupo = grupoSelecaoAtivo ?? grupoSelecionarTodos;
    if (!grupo) {
      return;
    }

    if (todosPaginaSelecionados) {
      setSelectedIds((atual) => {
        const proximo = new Set(atual);
        itemsSelecionaveisPagina.forEach((item) => proximo.delete(item.id));
        return proximo;
      });
      return;
    }

    setSelectedIds((atual) => {
      const proximo = new Set(atual);
      itemsSelecionaveisPagina.forEach((item) => proximo.add(item.id));
      return proximo;
    });
  }, [
    grupoSelecaoAtivo,
    grupoSelecionarTodos,
    itemsSelecionaveisPagina,
    todosPaginaSelecionados,
  ]);

  const abrirModalMovimentacao = useCallback(() => {
    if (idsParaMovimentacao.length === 0) {
      return;
    }

    setModalMovimentacaoAberto(true);
  }, [idsParaMovimentacao.length]);

  const abrirModalReagendar = useCallback(() => {
    if (idsParaReagendar.length === 0) {
      return;
    }

    setModalReagendarAberto(true);
  }, [idsParaReagendar.length]);

  const confirmarReagendamento = useCallback(
    async (novaData: Date) => {
      await reagendarRecebimentos(idsParaReagendar, novaData);
      setSelectedIds(new Set());
      setModalReagendarAberto(false);
    },
    [idsParaReagendar, reagendarRecebimentos],
  );

  const limparFiltros = useCallback(() => {
    setFiltroTurno('todos');
    setBusca('');
    setFiltrosAvancados(getDefaultRecebimentoFiltrosAvancados());
  }, [setBusca, setFiltroTurno, setFiltrosAvancados]);

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
      setSelectedIds((atual) => {
        if (!atual.has(alvo.id)) {
          return atual;
        }

        const proximo = new Set(atual);
        proximo.delete(alvo.id);
        return proximo;
      });
      setRecebimentoParaExcluir(null);
    } catch {
      // Erro já exibido pelo hook
    } finally {
      setExcluindo(false);
    }
  }, [cancelarRecebimento, recebimentoParaExcluir]);

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

      <main className="px-margin-mobile py-4 md:px-margin-desktop md:py-5">
        <div className="mx-auto max-w-container">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                <PackageOpen className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-headline-md font-semibold tracking-tight text-foreground md:text-headline-lg">
                  Recebimentos previstos
                </h1>
                <p className="truncate text-xs text-muted-foreground">
                  Agendamentos, docas e status da operação de entrada
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-outline-variant px-3 text-xs"
                asChild
              >
                <Link href="/recebimento/painel">
                  <LayoutDashboard className="size-3.5" aria-hidden />
                  Painel
                </Link>
              </Button>
              <Button size="sm" className="h-8 gap-1.5 px-3 text-xs" asChild>
                <Link href="/recebimento/novo">
                  <Plus className="size-3.5" aria-hidden />
                  Novo
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <RecebimentoStatsCards
              hoje={stats.hoje}
              volumeEsperado={stats.volumeEsperado}
              docasOcupadas={stats.docasOcupadas}
              docasTotal={stats.docasTotal}
              atrasos={stats.atrasos}
              onAtrasadosClick={() => setFiltroTurno('atrasados')}
            />

            <div className="grid gap-4 xl:grid-cols-[1fr_minmax(240px,280px)] xl:items-start">
              <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
                <div className="border-b border-outline-variant bg-surface-low/30 px-3 py-2.5 md:px-4">
                  <RecebimentoUtilityBar
                    embedded
                    filtroTurno={filtroTurno}
                    onTurnoChange={setFiltroTurno}
                    busca={busca}
                    onBuscaChange={setBusca}
                    statusFiltro={filtrosAvancados.situacao}
                    onStatusFiltroChange={(situacao) =>
                      setFiltrosAvancados({ ...filtrosAvancados, situacao })
                    }
                    onFiltrosAvancados={() => setFiltrosSheetAberto(true)}
                    filtrosAvancadosAtivos={filtrosAvancadosAtivos}
                    onGerarMovimentacao={
                      idsParaMovimentacao.length > 0
                        ? abrirModalMovimentacao
                        : undefined
                    }
                    onReagendar={
                      idsParaReagendar.length > 0 ? abrirModalReagendar : undefined
                    }
                    onSelecionarTodos={selecionarTodosFiltrados}
                    onLimparSelecao={limparSelecao}
                    selecionaveisTotal={itemsSelecionaveisFiltrados.length}
                    todosSelecionados={todosFiltradosSelecionados}
                    selecionadosCount={selectedIds.size}
                    totalFiltrados={isLoading ? undefined : totalFiltrados}
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className={compactTableClassName}>
                    <thead>
                      <tr className={compactTableHeadRowClassName}>
                        <th className={compactTableHeadCellClassName('w-8')}>
                          {!isLoading && itemsSelecionaveisPagina.length > 0 ? (
                            <input
                              type="checkbox"
                              checked={todosPaginaSelecionados}
                              ref={(element) => {
                                if (element) {
                                  element.indeterminate = algunsPaginaSelecionados;
                                }
                              }}
                              onChange={toggleTodosPagina}
                              className="size-3.5 rounded border-outline-variant text-primary focus:ring-primary"
                              aria-label="Selecionar todos da página"
                            />
                          ) : null}
                        </th>
                        {TABLE_HEADERS.slice(1).map((header) => (
                          <th
                            key={header.label || 'actions'}
                            className={compactTableHeadCellClassName(
                              header.className,
                            )}
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
                            className="px-4 py-12"
                          >
                            <div className="flex flex-col items-center justify-center gap-2 text-center">
                              <Loader2
                                className="size-6 animate-spin text-primary"
                                aria-hidden
                              />
                              <p className="text-xs text-muted-foreground">
                                Carregando recebimentos…
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : listaVazia ? (
                        <tr>
                          <td
                            colSpan={TABLE_HEADERS.length}
                            className="px-4 py-12"
                          >
                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                              <div className="flex size-11 items-center justify-center rounded-full bg-surface-highest text-muted-foreground">
                                {temFiltrosAtivos ? (
                                  <SearchX className="size-6" aria-hidden />
                                ) : (
                                  <PackageOpen className="size-6" aria-hidden />
                                )}
                              </div>
                              <div className="max-w-sm space-y-0.5">
                                <p className="text-sm font-semibold text-foreground">
                                  {temFiltrosAtivos
                                    ? 'Nenhum recebimento encontrado'
                                    : 'Nenhum agendamento hoje'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {temFiltrosAtivos
                                    ? 'Ajuste os filtros ou a busca para ver outros resultados.'
                                    : 'Cadastre um novo recebimento para iniciar a operação de entrada.'}
                                </p>
                              </div>
                              {temFiltrosAtivos ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={limparFiltros}
                                >
                                  Limpar filtros
                                </Button>
                              ) : (
                                <Button size="sm" className="gap-1.5" asChild>
                                  <Link href="/recebimento/novo">
                                    <Plus className="size-4" aria-hidden />
                                    Novo recebimento
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        itemsPagina.map((r) => (
                          <RecebimentoRow
                            key={r.id}
                            recebimento={r}
                            detailHref={`/recebimento/${r.id}`}
                            selecionavel={podeSelecionarItem(r, grupoSelecaoAtivo)}
                            selecionado={selectedIds.has(r.id)}
                            onSelecionar={toggleSelecao}
                            onExcluir={iniciarExclusao}
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
                    pageSizeOptions={pageSizeOptions}
                    onPageSizeChange={setPageSize}
                    resourceLabelPlural="recebimentos"
                    compact
                  />
                ) : null}
              </section>

              <DocasControl docas={docas} compact />
            </div>
          </div>
        </div>
      </main>

      <RecebimentoFiltrosAvancadosSheet
        open={filtrosSheetAberto}
        onOpenChange={setFiltrosSheetAberto}
        filtros={filtrosAvancados}
        onAplicar={setFiltrosAvancados}
      />

      <ModalGerarMovimentacao
        open={modalMovimentacaoAberto}
        onClose={() => setModalMovimentacaoAberto(false)}
        selectedIds={idsParaMovimentacao}
      />

      <ModalReagendarRecebimento
        open={modalReagendarAberto}
        onClose={() => setModalReagendarAberto(false)}
        selectedIds={idsParaReagendar}
        onConfirmar={confirmarReagendamento}
      />
    </SidebarMain>
  );
}
