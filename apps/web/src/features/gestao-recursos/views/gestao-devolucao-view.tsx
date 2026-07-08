'use client';

import {
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { AlocarDemandaDevolucaoModal } from '@/features/gestao-recursos/components/alocar-demanda-devolucao-modal';
import { ConfirmarPausaOperadorModal } from '@/features/gestao-recursos/components/confirmar-pausa-operador-modal';
import { IdleOperatorCard } from '@/features/gestao-recursos/components/idle-operator-card';
import { KpiCardItem } from '@/features/gestao-recursos/components/kpi-card';
import { NeedsBreakOperatorCard } from '@/features/gestao-recursos/components/needs-break-operator-card';
import { OperatorRow } from '@/features/gestao-recursos/components/operator-row';
import { PausedOperatorCard } from '@/features/gestao-recursos/components/paused-operator-card';
import { PrecisaPausaBanner } from '@/features/gestao-recursos/components/precisa-pausa-banner';
import { useGestaoRecursosDevolucao } from '@/features/gestao-recursos/hooks/use-gestao-recursos-devolucao';
import { SessaoPausasContextBanner } from '@/features/pausas/components/sessao-pausas-context-banner';
import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';

const searchInputClassName =
  'w-full rounded-lg border border-outline-variant bg-surface-lowest py-1 pl-8 pr-3 text-caption text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-0 md:w-52';

function SectionCount({ count }: { count: number }) {
  return (
    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
      {count}
    </span>
  );
}

export function GestaoDevolucaoView() {
  const {
    kpis,
    atuandoOperators,
    ociososOperators,
    pausaOperators,
    precisaPausaOperators,
    expandedRows,
    searchQuery,
    isRefreshing,
    isLoading,
    isSubmitting,
    removendoAlocacaoId,
    canShowPainel,
    semUnidade,
    semSessaoAberta,
    sessaoAtiva,
    sessoesAbertas,
    funcionarios,
    operators,
    alocarModalOpen,
    preselectedSessaoFuncionarioId,
    setSearchQuery,
    toggleRow,
    triggerRefresh,
    openAlocarModal,
    closeAlocarModal,
    onAlocacaoCriada,
    removerAlocacao,
    selectSessao,
    pausaModalOpen,
    pausaModalOperator,
    pausaModalAction,
    isSubmittingPausa,
    requestIniciarPausaTermica,
    requestEncerrarPausa,
    closePausaConfirmModal,
    confirmPausaAction,
    setIsSubmitting,
  } = useGestaoRecursosDevolucao();

  return (
    <SidebarMain>
      <main className="relative min-h-dvh">
        <div className="space-y-3 px-margin-mobile py-3 md:px-margin-desktop md:py-4">
          <div className="mx-auto max-w-container space-y-3">
            <header className="flex flex-wrap items-end justify-between gap-3 border-b border-outline-variant pb-3">
              <div className="min-w-0">
                <nav className="mb-0.5 flex flex-wrap gap-1.5 text-caption text-muted-foreground">
                  <Link href="/op-wms" className="hover:text-primary">
                    Warehouse
                  </Link>
                  <span aria-hidden>/</span>
                  <span>Operações</span>
                  <span aria-hidden>/</span>
                  <Link href="/op-wms/gestao-recursos" className="hover:text-primary">
                    Gestão de Recursos
                  </Link>
                  <span aria-hidden>/</span>
                  <span className="text-primary">Devolução</span>
                </nav>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-headline-md font-semibold text-foreground">
                    Monitoramento de Devolução
                  </h1>
                  {canShowPainel ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-low px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>
                      Live
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search
                    className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className={searchInputClassName}
                    placeholder="Nome, matrícula ou ID..."
                    disabled={!canShowPainel}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-caption"
                  disabled={!canShowPainel || isSubmitting}
                  onClick={() => openAlocarModal()}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Alocar operador
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-caption"
                  disabled={isRefreshing || !canShowPainel}
                  onClick={() => void triggerRefresh()}
                >
                  {isRefreshing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  )}
                  Atualizar
                </Button>
              </div>
            </header>

            <SessaoPausasContextBanner
              semUnidade={semUnidade}
              semSessaoAberta={semSessaoAberta}
              isLoading={isLoading && !canShowPainel}
              sessaoAtiva={sessaoAtiva}
              sessoesAbertas={sessoesAbertas}
              onSelectSessao={selectSessao}
              semUnidadeMessage="Selecione uma unidade no menu superior para gerenciar recursos."
              emptySessaoTitle="Nenhuma sessão aberta"
              emptySessaoDescription="Abra uma sessão em Sessão Operação para monitorar devolução."
              showDataReferenciaInSelector
            />

            {canShowPainel && !isLoading ? (
              <PrecisaPausaBanner count={precisaPausaOperators.length} />
            ) : null}

            {isLoading && canShowPainel ? (
              <div className="flex min-h-[240px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : null}

            {canShowPainel && !isLoading ? (
              <>
                <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
                  {kpis.map((kpi) => (
                    <KpiCardItem key={kpi.id} kpi={kpi} />
                  ))}
                </section>

                <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-12">
                  <section
                    className={cn(
                      glassPanelClassName,
                      'flex flex-col overflow-hidden lg:col-span-8',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-outline-variant bg-surface-high/50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" aria-hidden />
                        <h2 className="text-label-md font-medium text-foreground">
                          Atuando
                        </h2>
                        <SectionCount count={atuandoOperators.length} />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className={compactTableClassName}>
                        <thead>
                          <tr className={compactTableHeadRowClassName}>
                            <th className={compactTableHeadCellClassName('w-7')} scope="col" />
                            <th className={compactTableHeadCellClassName()} scope="col">
                              Operador
                            </th>
                            <th className={compactTableHeadCellClassName()} scope="col">
                              Missão
                            </th>
                            <th
                              className={compactTableHeadCellClassName('min-w-[7rem]')}
                              scope="col"
                            >
                              Progresso
                            </th>
                            <th className={compactTableHeadCellClassName()} scope="col">
                              Início
                            </th>
                            <th className={compactTableHeadCellClassName()} scope="col">
                              Previsão término
                            </th>
                            <th
                              className={compactTableHeadCellClassName('w-8 text-right')}
                              scope="col"
                            />
                          </tr>
                        </thead>
                        <tbody className={compactTableBodyClassName}>
                          {atuandoOperators.length === 0 ? (
                            <tr>
                              <td className={compactTableEmptyCellClassName} colSpan={7}>
                                Nenhum operador alocado em devolução no momento.
                              </td>
                            </tr>
                          ) : (
                            atuandoOperators.map((operator) => (
                              <OperatorRow
                                key={operator.id}
                                operator={operator}
                                isExpanded={expandedRows.has(operator.id)}
                                onToggle={toggleRow}
                                onAssignTask={openAlocarModal}
                                onFinalizarDemanda={(alocacaoId) =>
                                  void removerAlocacao(alocacaoId)
                                }
                                isAssigning={isSubmitting}
                                finalizandoDemandaId={removendoAlocacaoId}
                                taskActionLabel="Remover alocação"
                              />
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <aside className="flex flex-col gap-3 lg:col-span-4">
                    <NeedsBreakOperatorCard
                      operators={precisaPausaOperators}
                      isLoading={isSubmittingPausa}
                      onIniciarPausaTermica={requestIniciarPausaTermica}
                    />
                    <IdleOperatorCard
                      operators={ociososOperators}
                      isLoading={isSubmitting}
                      onAssignTask={openAlocarModal}
                    />
                    <PausedOperatorCard
                      operators={pausaOperators}
                      isLoading={isSubmittingPausa}
                      onEncerrarPausa={requestEncerrarPausa}
                    />
                  </aside>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {sessaoAtiva ? (
          <>
            <AlocarDemandaDevolucaoModal
              open={alocarModalOpen}
              sessaoId={sessaoAtiva.id}
              unidadeId={sessaoAtiva.unidadeId}
              funcionarios={funcionarios}
              operators={operators}
              preselectedSessaoFuncionarioId={preselectedSessaoFuncionarioId}
              isSubmitting={isSubmitting}
              onClose={closeAlocarModal}
              onSuccess={onAlocacaoCriada}
              setIsSubmitting={setIsSubmitting}
            />
            <ConfirmarPausaOperadorModal
              open={pausaModalOpen}
              operator={pausaModalOperator}
              action={pausaModalAction}
              isSubmitting={isSubmittingPausa}
              onClose={closePausaConfirmModal}
              onConfirm={() => void confirmPausaAction()}
            />
          </>
        ) : null}

        <Button
          type="button"
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full bg-destructive text-destructive-foreground shadow-lg"
          aria-label="Relatório de emergência"
        >
          <AlertCircle className="h-5 w-5" aria-hidden />
        </Button>
      </main>
    </SidebarMain>
  );
}
