'use client';

import { CompactKpiStrip } from '@/features/dashboard-operacional/components/compact-kpi-strip';
import {
  DevolucoesMotivoChart,
  EntregasHoraAreaChart,
  PipelineBarChart,
  ProdutividadeOperacionalPanel,
  RotasProgressBars,
  TransporteIndicadoresPanel,
  VolumeDistributionDonut,
} from '@/features/dashboard-operacional/components/dashboard-charts';
import { DashboardTvHeader } from '@/features/dashboard-operacional/components/dashboard-tv-header';
import { DevolucoesTvTicker } from '@/features/dashboard-operacional/components/devolucoes-tv-ticker';
import { MOCK_DASHBOARD_OPERACIONAL } from '@/features/dashboard-operacional/mocks/dashboard-operacional.mock';

import { useUnidadeContext } from '@/contexts/unidade-context';

function parseKpiNumber(value: string): number {
  return Number(value.replace(/\./g, '').replace(',', '.')) || 0;
}

export function DashboardOperacionalView() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeNome = unidadeSelecionada?.nome;
  const snapshot = MOCK_DASHBOARD_OPERACIONAL;

  const volumeTotal = parseKpiNumber(
    snapshot.kpis.find((k) => k.id === 'volume-dia')?.value ?? '0',
  );
  const entregues = parseKpiNumber(
    snapshot.kpis.find((k) => k.id === 'entregas-realizadas')?.value ?? '0',
  );
  const devolucoes = parseKpiNumber(
    snapshot.kpis.find((k) => k.id === 'devolucoes')?.value ?? '0',
  );

  return (
    <div
      className="dashboard-tv-screen fixed inset-0 z-[100] flex h-dvh flex-col overflow-hidden bg-[hsl(240_6%_5%)] text-white"
      data-dashboard-tv
    >
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-[20%] top-0 size-[50vmax] rounded-full bg-primary/12 blur-[100px]" />
        <div className="absolute -right-[10%] top-[10%] size-[40vmax] rounded-full bg-tertiary/8 blur-[90px]" />
        <div
          className="absolute inset-0 opacity-[0.2] blueprint-grid"
          style={{ backgroundColor: 'transparent' }}
        />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col gap-3 px-4 py-3 md:px-6 md:py-4">
        <DashboardTvHeader
          unidadeNome={unidadeNome}
          dataReferencia={snapshot.dataReferencia}
          turnoLabel={snapshot.turnoLabel}
        />

        <CompactKpiStrip kpis={snapshot.kpis} />

        <div className="grid min-h-0 flex-1 grid-cols-12 gap-3">
          <div className="col-span-12 grid min-h-0 grid-cols-12 gap-3 lg:col-span-8 lg:grid-rows-2">
            <PipelineBarChart
              etapas={snapshot.pipeline}
              className="col-span-12 min-h-0 lg:col-span-5"
            />
            <EntregasHoraAreaChart
              pontos={snapshot.entregasPorHora}
              className="col-span-12 min-h-0 lg:col-span-4"
            />
            <ProdutividadeOperacionalPanel
              produtividade={snapshot.produtividade}
              className="col-span-12 min-h-0 lg:col-span-3"
            />
            <RotasProgressBars
              rotas={snapshot.rotas}
              maxItems={8}
              className="col-span-12 min-h-0 lg:col-span-7"
            />
            <TransporteIndicadoresPanel
              transporte={snapshot.transporte}
              className="col-span-12 min-h-0 lg:col-span-5"
            />
          </div>

          <div className="col-span-12 grid min-h-0 grid-cols-1 gap-3 lg:col-span-4">
            <VolumeDistributionDonut
              entregues={entregues}
              devolucoes={devolucoes}
              total={volumeTotal}
              className="min-h-0 flex-1"
            />
            <DevolucoesMotivoChart
              devolucoes={snapshot.devolucoesRecentes}
              className="min-h-0 flex-1"
            />
          </div>
        </div>

        <DevolucoesTvTicker devolucoes={snapshot.devolucoesRecentes} />
      </div>
    </div>
  );
}
