'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Loader2 } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import {
  segmentButtonClassName,
  segmentGroupClassName,
} from '@/features/expedicao-impressao-config/components/panel-styles';

import { SidebarMain } from '@/components/layout/sidebar';
import { AlertasOperacionaisSheet } from '@/features/torre-controle-expedicao/components/alertas-operacionais-sheet';
import { DocaDetalheSheet } from '@/features/torre-controle-expedicao/components/doca-detalhe-sheet';
import { DocasHeatmap } from '@/features/torre-controle-expedicao/components/docas-heatmap';
import { EtapaDetalheSheet } from '@/features/torre-controle-expedicao/components/etapa-detalhe-sheet';
import { GestaoRecursosSetorPanel } from '@/features/torre-controle-expedicao/components/gestao-recursos-setor-panel';
import { PainelClientesExpedicao } from '@/features/torre-controle-expedicao/components/painel-clientes-expedicao';
import { PainelCriticidadeTable } from '@/features/torre-controle-expedicao/components/painel-criticidade-table';
import { PainelDecisaoPrioritariosAtrasados } from '@/features/torre-controle-expedicao/components/painel-decisao-prioritarios-atrasados';
import { PainelMapasTransporte } from '@/features/torre-controle-expedicao/components/painel-mapas-transporte';
import { PipelineOperacional } from '@/features/torre-controle-expedicao/components/pipeline-operacional';
import { TimelineOperacional } from '@/features/torre-controle-expedicao/components/timeline-operacional';
import { TorreControleFloatingBar } from '@/features/torre-controle-expedicao/components/torre-controle-floating-bar';
import { TorreControleHeader } from '@/features/torre-controle-expedicao/components/torre-controle-header';
import { TorreControleKpiStrip } from '@/features/torre-controle-expedicao/components/torre-controle-kpi-strip';
import { TorreControleQuickFilters } from '@/features/torre-controle-expedicao/components/torre-controle-quick-filters';
import { TransporteDetalheSheet } from '@/features/torre-controle-expedicao/components/transporte-detalhe-sheet';
import { useTorreControleExpedicao } from '@/features/torre-controle-expedicao/hooks/use-torre-controle-expedicao';

type AbaTorreControle = 'operacional' | 'mapas' | 'clientes';

const ABAS_TORRE_CONTROLE: { id: AbaTorreControle; label: string }[] = [
  { id: 'operacional', label: 'Operacional' },
  { id: 'mapas', label: 'Mapas' },
  { id: 'clientes', label: 'Clientes' },
];

export function TorreControleExpedicaoView() {
  const {
    isLoading,
    clock,
    snapshot,
    transportesRisco,
    transportesFiltrados,
    transportesAposFiltroRapido,
    transportesDecisaoPrioritaria,
    filtroRapido,
    filtroStatus,
    setFiltroStatus,
    contadoresStatus,
    apenasNaoFinalizados,
    setApenasNaoFinalizados,
    contadoresFiltro,
    aplicarFiltroRapido,
    alertas,
    turno,
    autoRefresh,
    setAutoRefresh,
    atualizadoHaLabel,
    refresh,
    transporteSelecionado,
    mapasTransporteSelecionado,
    sheetTransporteId,
    openTransporteSheet,
    closeTransporteSheet,
    etapaSelecionada,
    mapasEtapaSelecionada,
    sheetEtapa,
    openEtapaSheet,
    closeEtapaSheet,
    docaSelecionada,
    sheetDocaId,
    openDocaSheet,
    closeDocaSheet,
    fonteDados,
    erro,
    aviso,
    isRefreshing,
    unidadeNome,
    intervalo,
    setIntervalo,
    uploadLoteIdSelecionado,
    selecionarUploadLote,
    opcoesLote,
    handleAlertClick,
  } = useTorreControleExpedicao();

  const [alertasSheetAberto, setAlertasSheetAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<AbaTorreControle>('operacional');

  const alertasCriticosCount = useMemo(
    () => alertas.filter((alerta) => alerta.severity === 'error').length,
    [alertas],
  );

  const exibirDocas = snapshot.docas.length > 0;
  const exibirPainel = fonteDados === 'api' && !isLoading;

  return (
    <SidebarMain>
      <main className="relative min-h-dvh blueprint-grid pb-28">
        <div className="space-y-gutter px-margin-mobile py-4 md:px-margin-desktop md:py-6">
          <div className="mx-auto max-w-container space-y-gutter">
            <TorreControleHeader
              clock={clock}
              turnoLabel={turno.turnoLabel}
              sessaoId={turno.sessaoId}
              unidadeNome={unidadeNome}
              intervalo={intervalo}
              onIntervaloChange={setIntervalo}
              uploadLoteIdSelecionado={uploadLoteIdSelecionado}
              opcoesLote={opcoesLote}
              onUploadLoteChange={selecionarUploadLote}
              fonteDados={fonteDados}
              erro={erro}
              aviso={aviso}
              autoRefresh={autoRefresh}
              onAutoRefreshChange={setAutoRefresh}
              atualizadoHaLabel={atualizadoHaLabel}
              onRefresh={refresh}
              isRefreshing={isRefreshing}
            />

            {isLoading ? (
              <div
                className="flex min-h-[480px] items-center justify-center"
                role="status"
                aria-label="Carregando torre de controle"
              >
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : exibirPainel ? (
              <>
                <TorreControleKpiStrip kpis={snapshot.kpis} />

                <div
                  className={cn(segmentGroupClassName, 'w-full sm:w-auto')}
                  role="tablist"
                  aria-label="Seções da torre de controle"
                >
                  {ABAS_TORRE_CONTROLE.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={abaAtiva === id}
                      onClick={() => setAbaAtiva(id)}
                      className={segmentButtonClassName(abaAtiva === id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {abaAtiva === 'operacional' ? (
                  <>
                    <TorreControleQuickFilters
                      filtroAtivo={filtroRapido}
                      contadores={contadoresFiltro}
                      onFiltroChange={aplicarFiltroRapido}
                    />

                    <PainelDecisaoPrioritariosAtrasados
                      transportes={transportesDecisaoPrioritaria}
                      onVerTransporte={openTransporteSheet}
                      onVerTodos={aplicarFiltroRapido}
                    />

                    <PainelCriticidadeTable
                      transportes={transportesFiltrados}
                      transportesReferencia={transportesAposFiltroRapido}
                      apenasNaoFinalizados={apenasNaoFinalizados}
                      onApenasNaoFinalizadosChange={setApenasNaoFinalizados}
                      filtroStatus={filtroStatus}
                      onFiltroStatusChange={setFiltroStatus}
                      contadoresStatus={contadoresStatus}
                      onVerTransporte={openTransporteSheet}
                    />

                    <PipelineOperacional
                      etapas={snapshot.pipeline}
                      onEtapaClick={openEtapaSheet}
                    />

                    <div className="grid grid-cols-12 gap-gutter">
                      <div className="col-span-12 xl:col-span-5">
                        <GestaoRecursosSetorPanel recursos={snapshot.recursos} />
                      </div>
                      <div className="col-span-12 xl:col-span-7">
                        <TimelineOperacional
                          pontos={snapshot.timeline}
                          horaAtual={clock.slice(0, 5)}
                        />
                      </div>
                    </div>

                    {exibirDocas ? (
                      <DocasHeatmap
                        docas={snapshot.docas}
                        onDocaClick={openDocaSheet}
                      />
                    ) : null}
                  </>
                ) : null}

                {abaAtiva === 'mapas' ? (
                  <PainelMapasTransporte
                    mapas={snapshot.mapas}
                    onVerTransporte={openTransporteSheet}
                  />
                ) : null}

                {abaAtiva === 'clientes' ? <PainelClientesExpedicao /> : null}
              </>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-xl border border-outline-variant bg-surface-low/30 px-6 py-12 text-center">
                <p className="max-w-md text-body-md text-muted-foreground">
                  {aviso ??
                    erro ??
                    'Nenhum dado operacional disponível para os filtros atuais.'}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/transporte">Ir para Expedição de Cargas</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {exibirPainel ? (
          <TorreControleFloatingBar
            turno={turno}
            alertasCount={alertas.length}
            alertasCriticosCount={alertasCriticosCount}
            onOpenAlertas={() => setAlertasSheetAberto(true)}
          />
        ) : null}

        <AlertasOperacionaisSheet
          open={alertasSheetAberto}
          alertas={alertas}
          onOpenChange={setAlertasSheetAberto}
          onAlertClick={handleAlertClick}
        />

        <TransporteDetalheSheet
          open={sheetTransporteId !== null}
          transporte={transporteSelecionado}
          mapas={mapasTransporteSelecionado}
          onOpenChange={(open) => !open && closeTransporteSheet()}
          onVerDoca={exibirDocas ? openDocaSheet : undefined}
          docas={
            exibirDocas
              ? snapshot.docas.map((d) => ({ id: d.id, label: d.label }))
              : []
          }
        />

        <EtapaDetalheSheet
          open={sheetEtapa !== null}
          etapa={etapaSelecionada}
          mapas={mapasEtapaSelecionada}
          onOpenChange={(open) => !open && closeEtapaSheet()}
        />

        {exibirDocas ? (
          <DocaDetalheSheet
            open={sheetDocaId !== null}
            doca={docaSelecionada}
            onOpenChange={(open) => !open && closeDocaSheet()}
          />
        ) : null}
      </main>
    </SidebarMain>
  );
}
