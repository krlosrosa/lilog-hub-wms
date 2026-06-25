'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { AdicionarAuxiliarModal } from '@/features/gestao-recursos/components/adicionar-auxiliar-modal';
import { CadastrarDemandaModal } from '@/features/gestao-recursos/components/cadastrar-demanda-modal';
import { CarregamentoDemandaCard } from '@/features/gestao-recursos/components/carregamento-demanda-card';
import { ConfirmarPausaOperadorModal } from '@/features/gestao-recursos/components/confirmar-pausa-operador-modal';
import { FinalizarDemandaModal } from '@/features/gestao-recursos/components/finalizar-demanda-modal';
import { IdleOperatorCard } from '@/features/gestao-recursos/components/idle-operator-card';
import { KpiCardItem } from '@/features/gestao-recursos/components/kpi-card';
import { NeedsBreakOperatorCard } from '@/features/gestao-recursos/components/needs-break-operator-card';
import { PausedOperatorCard } from '@/features/gestao-recursos/components/paused-operator-card';
import { PrecisaPausaBanner } from '@/features/gestao-recursos/components/precisa-pausa-banner';
import { useGestaoRecursosProcesso } from '@/features/gestao-recursos/hooks/use-gestao-recursos-processo';
import {
  listDocasExpedicao,
  type DocaSelectItem,
} from '@/features/gestao-recursos/lib/doca-api';
import { removeFuncionarioDemandaCarregamento } from '@/features/gestao-recursos/lib/gestao-recursos-api';
import type { DemandaSeparacaoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import {
  buildFuncionarioPorSessaoIdMap,
  funcionarioMatchesBusca,
} from '@/features/gestao-recursos/lib/funcionario-busca';
import type { SessaoFuncionarioApi } from '@/features/sessao-operacao/types/sessao.api';
import { SessaoPausasContextBanner } from '@/features/pausas/components/sessao-pausas-context-banner';
import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';

const searchInputClassName =
  'w-full rounded-lg border border-outline-variant bg-surface-lowest py-1 pl-8 pr-3 text-caption text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-0 md:w-52';

function filtrarDemandas(
  demandas: DemandaSeparacaoApi[],
  query: string,
  funcionarios: SessaoFuncionarioApi[] = [],
): DemandaSeparacaoApi[] {
  const termo = query.trim().toLowerCase();
  if (!termo) {
    return demandas;
  }

  const funcionarioPorSessaoId = buildFuncionarioPorSessaoIdMap(funcionarios);

  function demandaMatchFuncionario(demanda: DemandaSeparacaoApi): boolean {
    const responsavel = funcionarioPorSessaoId.get(demanda.sessaoFuncionarioId);

    if (funcionarioMatchesBusca(responsavel, termo)) {
      return true;
    }

    if (String(demanda.funcionarioId).includes(termo)) {
      return true;
    }

    for (const membro of demanda.funcionarios ?? []) {
      const funcionario = funcionarioPorSessaoId.get(membro.sessaoFuncionarioId);

      if (
        funcionarioMatchesBusca(funcionario, termo) ||
        String(membro.funcionarioId).includes(termo)
      ) {
        return true;
      }
    }

    return false;
  }

  return demandas.filter(
    (demanda) =>
      demanda.mapaGrupoTitulo.toLowerCase().includes(termo) ||
      demanda.mapaGrupoMicroUuid.toLowerCase().includes(termo) ||
      demanda.transporteRota?.toLowerCase().includes(termo) ||
      demandaMatchFuncionario(demanda),
  );
}

export function GestaoCarregamentoView() {
  const {
    kpis,
    demandas,
    atuandoOperators,
    ociososOperators,
    pausaOperators,
    precisaPausaOperators,
    funcionarios,
    searchQuery,
    isRefreshing,
    isLoading,
    isSubmitting,
    canShowPainel,
    semUnidade,
    semSessaoAberta,
    sessaoAtiva,
    sessoesAbertas,
    cadastrarDemandaOpen,
    preselectedSessaoFuncionarioId,
    setSearchQuery,
    triggerRefresh,
    openCadastrarDemanda,
    closeCadastrarDemanda,
    onDemandasCriadas,
    finalizarDemanda,
    finalizandoDemandaId,
    finalizarDemandaModalOpen,
    finalizarDemandaOperator,
    finalizarDemandaMapaTitulo,
    closeFinalizarDemandaModal,
    confirmFinalizarDemanda,
    selectSessao,
    openEmergencyReport,
    loadRecursosFromApi,
    pausaModalOpen,
    pausaModalOperator,
    pausaModalAction,
    isSubmittingPausa,
    requestIniciarPausaTermica,
    requestEncerrarPausa,
    closePausaConfirmModal,
    confirmPausaAction,
  } = useGestaoRecursosProcesso('carregamento');

  const [auxiliarModalOpen, setAuxiliarModalOpen] = useState(false);
  const [demandaSelecionada, setDemandaSelecionada] =
    useState<DemandaSeparacaoApi | null>(null);
  const [removendoFuncionarioId, setRemovendoFuncionarioId] = useState<
    string | null
  >(null);
  const [docas, setDocas] = useState<DocaSelectItem[]>([]);

  useEffect(() => {
    if (!sessaoAtiva?.unidadeId) {
      setDocas([]);
      return;
    }

    void listDocasExpedicao(sessaoAtiva.unidadeId)
      .then(setDocas)
      .catch(() => {
        toast.error('Não foi possível carregar as docas');
      });
  }, [sessaoAtiva?.unidadeId]);

  const demandasAtivas = useMemo(
    () =>
      filtrarDemandas(
        demandas.filter(
          (demanda) =>
            demanda.status === 'pendente' || demanda.status === 'em_andamento',
        ),
        searchQuery,
        funcionarios,
      ),
    [demandas, searchQuery, funcionarios],
  );

  const openAdicionarAuxiliar = (demanda: DemandaSeparacaoApi) => {
    setDemandaSelecionada(demanda);
    setAuxiliarModalOpen(true);
  };

  const closeAdicionarAuxiliar = () => {
    if (isSubmitting) {
      return;
    }
    setAuxiliarModalOpen(false);
    setDemandaSelecionada(null);
  };

  const handleAuxiliarAdicionado = async () => {
    await loadRecursosFromApi();
    closeAdicionarAuxiliar();
    toast.success('Auxiliar adicionado ao carregamento');
  };

  const handleRemoverAuxiliar = async (
    demandaId: string,
    sessaoFuncionarioId: string,
  ) => {
    setRemovendoFuncionarioId(sessaoFuncionarioId);

    try {
      await removeFuncionarioDemandaCarregamento(
        demandaId,
        sessaoFuncionarioId,
      );
      await loadRecursosFromApi();
      toast.success('Auxiliar removido do carregamento');
    } catch {
      toast.error('Não foi possível remover o auxiliar');
    } finally {
      setRemovendoFuncionarioId(null);
    }
  };

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
                  <Link
                    href="/op-wms/gestao-recursos"
                    className="hover:text-primary"
                  >
                    Gestão de Recursos
                  </Link>
                  <span aria-hidden>/</span>
                  <span className="text-primary">Carregamento</span>
                </nav>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-headline-md font-semibold text-foreground">
                    Monitoramento de Carregamento
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
                    placeholder="Rota, mapa ou funcionário..."
                    aria-label="Buscar carregamento por rota, mapa ou funcionário"
                    disabled={!canShowPainel}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-caption"
                  disabled={!canShowPainel || isSubmitting}
                  onClick={() => openCadastrarDemanda()}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Iniciar carregamento
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-caption"
                  disabled={isRefreshing || !canShowPainel}
                  onClick={triggerRefresh}
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
              emptySessaoDescription="Abra uma sessão em Sessão Operação para monitorar recursos."
              showDataReferenciaInSelector
            />

            {canShowPainel && !isLoading ? (
              <PrecisaPausaBanner count={precisaPausaOperators.length} />
            ) : null}

            {isLoading && canShowPainel ? (
              <div
                className="flex min-h-[240px] items-center justify-center"
                role="status"
                aria-label="Carregando carregamentos"
              >
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
                    <div className="flex items-center gap-2 border-b border-outline-variant bg-surface-high/50 px-3 py-2">
                      <Truck className="h-4 w-4 text-warning" aria-hidden />
                      <h2 className="text-label-md font-medium text-foreground">
                        Carregamentos em andamento
                      </h2>
                      <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-warning">
                        {demandasAtivas.length}
                      </span>
                    </div>

                    <div className="divide-y divide-outline-variant">
                      {demandasAtivas.length === 0 ? (
                        <p className="px-4 py-10 text-center text-caption text-muted-foreground">
                          Nenhum carregamento ativo no momento.
                        </p>
                      ) : (
                        demandasAtivas.map((demanda) => (
                          <CarregamentoDemandaCard
                            key={demanda.id}
                            demanda={demanda}
                            funcionarios={funcionarios}
                            docas={docas}
                            isSubmitting={isSubmitting}
                            finalizandoDemandaId={finalizandoDemandaId}
                            removendoFuncionarioId={removendoFuncionarioId}
                            onAdicionarAuxiliar={openAdicionarAuxiliar}
                            onRemoverAuxiliar={handleRemoverAuxiliar}
                            onFinalizarDemanda={finalizarDemanda}
                          />
                        ))
                      )}
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
                      onAssignTask={openCadastrarDemanda}
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
            <CadastrarDemandaModal
              open={cadastrarDemandaOpen}
              sessaoId={sessaoAtiva.id}
              unidadeId={sessaoAtiva.unidadeId}
              funcionarios={funcionarios}
              operators={[...atuandoOperators, ...ociososOperators]}
              preselectedSessaoFuncionarioId={preselectedSessaoFuncionarioId}
              processoFixo="carregamento"
              isSubmitting={isSubmitting}
              onClose={closeCadastrarDemanda}
              onSuccess={onDemandasCriadas}
            />
            <ConfirmarPausaOperadorModal
              open={pausaModalOpen}
              operator={pausaModalOperator}
              action={pausaModalAction}
              isSubmitting={isSubmittingPausa}
              onClose={closePausaConfirmModal}
              onConfirm={confirmPausaAction}
            />
            <AdicionarAuxiliarModal
              open={auxiliarModalOpen}
              demanda={demandaSelecionada}
              funcionarios={funcionarios}
              isSubmitting={isSubmitting}
              onClose={closeAdicionarAuxiliar}
              onSuccess={handleAuxiliarAdicionado}
            />
            <FinalizarDemandaModal
              open={finalizarDemandaModalOpen}
              operator={finalizarDemandaOperator}
              mapaTitulo={finalizarDemandaMapaTitulo}
              isSubmitting={Boolean(finalizandoDemandaId)}
              onClose={closeFinalizarDemandaModal}
              onConfirm={() => void confirmFinalizarDemanda()}
            />
          </>
        ) : null}

        <Button
          type="button"
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full bg-destructive text-destructive-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
          onClick={openEmergencyReport}
          aria-label="Relatório de emergência"
        >
          <AlertCircle className="h-5 w-5" aria-hidden />
        </Button>
      </main>
    </SidebarMain>
  );
}
