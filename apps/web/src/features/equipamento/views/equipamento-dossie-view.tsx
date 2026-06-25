'use client';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import {
  AlertTriangle,
  Battery,
  CheckCircle2,
  DollarSign,
  Gauge,
  Loader2,
  Thermometer,
  Wrench,
} from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import { DossieTabDocumentos } from '@/features/equipamento/components/dossie-tab-documentos';
import { DossieTabGeral } from '@/features/equipamento/components/dossie-tab-geral';
import { DossieTabHistorico } from '@/features/equipamento/components/dossie-tab-historico';
import { DossieTabInspecoes } from '@/features/equipamento/components/dossie-tab-inspecoes';
import { DossieTabOperadores } from '@/features/equipamento/components/dossie-tab-operadores';
import { EquipamentoBentoCard } from '@/features/equipamento/components/equipamento-bento-card';
import { EquipamentoSkeleton } from '@/features/equipamento/components/equipamento-skeleton';
import { EquipamentoStatusBadge } from '@/features/equipamento/components/equipamento-status-badge';
import { useEquipamentoDossie } from '@/features/equipamento/hooks/use-equipamento-dossie';
import {
  EQUIPAMENTO_DOSSIE_TAB_LABELS,
  type EquipamentoDossieTab,
} from '@/features/equipamento/types/equipamento.schema';

const TABS: EquipamentoDossieTab[] = [
  'geral',
  'historico',
  'inspecoes',
  'operadores',
  'documentos',
];

type EquipamentoDossieViewProps = {
  equipamentoId: string;
};

function TelemetryHud({
  bateria,
  temperatura,
  carga,
}: {
  bateria: number;
  temperatura: number;
  carga: number;
}) {
  return (
    <div
      className="fixed bottom-6 right-6 z-30 hidden rounded-lg border border-outline-variant bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass lg:block"
      aria-label="Telemetria ao vivo"
    >
      <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
        Live Telemetry
      </p>
      <div className="flex gap-6 font-mono text-caption">
        <div className="flex items-center gap-1.5 text-primary">
          <Battery className="size-3.5" aria-hidden />
          <span>BATT {bateria}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Thermometer className="size-3.5" aria-hidden />
          <span>TEMP {temperatura}°C</span>
        </div>
        <div className="flex items-center gap-1.5 text-secondary-foreground">
          <Gauge className="size-3.5" aria-hidden />
          <span>LOAD {carga}%</span>
        </div>
      </div>
    </div>
  );
}

export function EquipamentoDossieView({
  equipamentoId,
}: EquipamentoDossieViewProps) {
  const {
    equipamento,
    isLoading,
    tabAtiva,
    setTab,
    processandoAcao,
    abrirChamado,
  } = useEquipamentoDossie(equipamentoId);

  if (!isLoading && !equipamento) {
    return (
      <SidebarMain className="flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-margin-mobile py-16 md:px-margin-desktop">
          <div className="max-w-md text-center">
            <h1 className="text-headline-lg font-semibold tracking-tight text-foreground">
              Equipamento não encontrado
            </h1>
            <p className="mt-2 text-body-md text-muted-foreground">
              Não há registro correspondente ao identificador informado nos
              dados mock.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/equipamento">Voltar para diretório</Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  return (
    <SidebarMain className="flex min-h-dvh flex-col blueprint-grid">
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-glass-bg px-margin-mobile backdrop-blur-glass md:px-margin-desktop">
        <nav
          aria-label="Navegação estrutural"
          className="flex items-center gap-2 text-label-md"
        >
          <Link
            href="/equipamento"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Equipamentos
          </Link>
          <span className="text-muted-foreground" aria-hidden>
            /
          </span>
          <span className="font-semibold text-foreground">Dossiê técnico</span>
        </nav>
      </header>

      <main className="relative flex-1 overflow-y-auto px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        {isLoading || !equipamento ? (
          <div className="space-y-6">
            <EquipamentoSkeleton className="h-16 w-full max-w-2xl" />
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <EquipamentoSkeleton key={i} className="h-32" />
              ))}
            </div>
            <EquipamentoSkeleton className="h-64" />
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 items-end gap-gutter lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <span className="rounded bg-secondary px-3 py-1 font-mono text-label-sm text-secondary-foreground">
                    {equipamento.tag}
                  </span>
                  <EquipamentoStatusBadge status={equipamento.status} />
                  <span className="flex items-center gap-1 text-status-active">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    <span className="text-label-sm font-medium uppercase">
                      Disponível
                    </span>
                  </span>
                </div>
                <h1 className="text-display-lg font-bold uppercase tracking-tight text-primary">
                  Dossiê técnico: {equipamento.nome}
                </h1>
                <p className="mt-1 font-mono text-caption text-muted-foreground">
                  REF: {equipamento.refTecnica}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2 lg:col-span-4">
                <Button
                  type="button"
                  disabled={processandoAcao}
                  className="gap-2"
                  onClick={() => void abrirChamado()}
                >
                  {processandoAcao ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Wrench className="h-4 w-4" aria-hidden />
                  )}
                  Abrir chamado de manutenção
                </Button>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
              <EquipamentoBentoCard
                label="Horas totais"
                value={`${equipamento.horasTotais.toLocaleString('pt-BR')} h`}
                subtext="Horímetro acumulado"
                icon={<Gauge className="h-5 w-5" aria-hidden />}
              />
              <EquipamentoBentoCard
                label="Próxima manutenção"
                value={equipamento.proximaManutencao}
                subtext={equipamento.proximaManutencaoDetalhe}
                variant="destructive"
                icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
              />
              <EquipamentoBentoCard
                label="Eficiência"
                value={`${equipamento.eficienciaPercent}%`}
                subtext="Taxa operacional"
                icon={<Gauge className="h-5 w-5" aria-hidden />}
                footer={
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${equipamento.eficienciaPercent}%`,
                      }}
                    />
                  </div>
                }
              />
              <EquipamentoBentoCard
                label="Custo acumulado (ano)"
                value={equipamento.custoAcumuladoAno}
                icon={<DollarSign className="h-5 w-5" aria-hidden />}
              />
            </div>

            <div>
              <div className="mb-6 flex overflow-x-auto border-b border-outline-variant">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={cn(
                      'shrink-0 px-6 py-4 font-mono text-label-sm uppercase transition-colors',
                      tabAtiva === tab
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    onClick={() => setTab(tab)}
                  >
                    {EQUIPAMENTO_DOSSIE_TAB_LABELS[tab]}
                  </button>
                ))}
              </div>

              <div className="min-h-[320px]">
                {tabAtiva === 'geral' && (
                  <DossieTabGeral equipamento={equipamento} />
                )}
                {tabAtiva === 'historico' && (
                  <DossieTabHistorico equipamento={equipamento} />
                )}
                {tabAtiva === 'inspecoes' && (
                  <DossieTabInspecoes equipamento={equipamento} />
                )}
                {tabAtiva === 'operadores' && (
                  <DossieTabOperadores equipamento={equipamento} />
                )}
                {tabAtiva === 'documentos' && (
                  <DossieTabDocumentos equipamento={equipamento} />
                )}
              </div>
            </div>

            <TelemetryHud
              bateria={equipamento.telemetria.bateriaPercent}
              temperatura={equipamento.telemetria.temperaturaC}
              carga={equipamento.telemetria.cargaPercent}
            />
          </>
        )}
      </main>
    </SidebarMain>
  );
}
