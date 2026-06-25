'use client';



import { Loader2 } from 'lucide-react';



import { Button } from '@lilog/ui';



import { SidebarMain } from '@/components/layout/sidebar';

import { PlanejamentoKpiStrip } from '@/features/distribuicao-demandas/components/planejamento-kpi-strip';

import { TransportesPendentesTable } from '@/features/distribuicao-demandas/components/transportes-pendentes-table';

import { usePlanejamentoDashboard } from '@/features/distribuicao-demandas/hooks/use-planejamento-dashboard';



export function PlanejamentoDashboardView() {

  const {

    isLoading,

    transportes,

    resumo,

    expandedTransporteIds,

    selectedTransporteIds,

    toggleExpand,

    toggleSelect,

    toggleSelectAll,

    iniciarDistribuicao,

    unidadeNome,

    semUnidade,

    errorMessage,

    filtroEmpresa,

    setFiltroEmpresa,

    filtroCategoria,

    setFiltroCategoria,

    empresasDisponiveis,

    categoriasDisponiveis,

    podeDistribuir,

    qtdSelecionados,

    transportesSelecionaveis,

  } = usePlanejamentoDashboard();



  return (

    <SidebarMain>

      <main className="min-h-dvh pb-12">

        <div className="px-margin-mobile pb-8 pt-6 md:px-margin-desktop md:pt-8">

          <div className="mx-auto max-w-container">

            <header className="mb-6">

              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">

                Distribuição Inteligente de Demandas

              </h1>

              <p className="mt-1 text-body-md text-muted-foreground">

                Selecione transportes pendentes e configure docas e funcionários na

                simulação — sem vínculo com sessão operacional

              </p>

            </header>



            {semUnidade ? (

              <div className="rounded-lg border border-outline-variant bg-surface-high/50 p-6 text-center text-muted-foreground">

                Selecione uma unidade para visualizar o planejamento.

              </div>

            ) : null}



            {!semUnidade && !isLoading ? (

              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-outline-variant bg-surface-high/30 px-4 py-3 text-sm">

                <span className="text-muted-foreground">

                  Unidade:{' '}

                  <span className="font-medium text-foreground">{unidadeNome}</span>

                </span>

                <span className="text-muted-foreground">

                  {transportes.length} transporte(s) pendente(s)

                </span>

                {qtdSelecionados > 0 ? (

                  <span className="font-medium text-foreground">

                    {qtdSelecionados} selecionado(s)

                  </span>

                ) : null}

              </div>

            ) : null}



            {!semUnidade && !isLoading ? (

              <div className="mb-4 flex flex-wrap gap-3">

                <label className="flex items-center gap-2 text-xs text-muted-foreground">

                  Empresa

                  <select

                    className="rounded border border-outline-variant bg-surface-low px-2 py-1 text-foreground"

                    value={filtroEmpresa}

                    onChange={(e) => setFiltroEmpresa(e.target.value)}

                  >

                    <option value="todas">Todas</option>

                    {empresasDisponiveis.map((e) => (

                      <option key={e} value={e}>

                        {e}

                      </option>

                    ))}

                  </select>

                </label>

                <label className="flex items-center gap-2 text-xs text-muted-foreground">

                  Categoria

                  <select

                    className="rounded border border-outline-variant bg-surface-low px-2 py-1 text-foreground"

                    value={filtroCategoria}

                    onChange={(e) => setFiltroCategoria(e.target.value)}

                  >

                    <option value="todas">Todas</option>

                    {categoriasDisponiveis.map((c) => (

                      <option key={c} value={c}>

                        {c}

                      </option>

                    ))}

                  </select>

                </label>

              </div>

            ) : null}



            {errorMessage ? (

              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">

                {errorMessage}

              </div>

            ) : null}



            {isLoading ? (

              <div

                className="flex min-h-[320px] items-center justify-center"

                role="status"

                aria-label="Carregando planejamento"

              >

                <Loader2 className="h-8 w-8 animate-spin text-primary" />

              </div>

            ) : resumo ? (

              <div className="space-y-gutter">

                <PlanejamentoKpiStrip resumo={resumo} />

                <TransportesPendentesTable

                  transportes={transportes}

                  expandedTransporteIds={expandedTransporteIds}

                  selectedTransporteIds={selectedTransporteIds}

                  transportesSelecionaveis={transportesSelecionaveis}

                  onToggleExpand={toggleExpand}

                  onToggleSelect={toggleSelect}

                  onToggleSelectAll={toggleSelectAll}

                  podeDistribuir={podeDistribuir}

                  onIniciarDistribuicao={iniciarDistribuicao}

                />

              </div>

            ) : null}

          </div>

        </div>

      </main>

    </SidebarMain>

  );

}

