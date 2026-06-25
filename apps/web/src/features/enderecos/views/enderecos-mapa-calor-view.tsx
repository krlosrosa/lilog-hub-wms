'use client';

import Link from 'next/link';

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Clock,
  Download,
  Hourglass,
  Loader2,
  Package,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  HeatCellButton,
  HeatmapLegend,
} from '@/features/enderecos/components/heat-cell';
import {
  glassPanelClassName,
  sectionCardClassName,
} from '@/features/enderecos/components/form-field-classes';
import { useEnderecosMapaCalor } from '@/features/enderecos/hooks/use-enderecos-mapa-calor';
import {
  MAPA_CALOR_TAB_LABELS,
} from '@/features/enderecos/types/enderecos-mapa-calor.schema';
import type {
  AlertaCritico,
  HeatCell,
  MapaCalorTab,
} from '@/features/enderecos/types/enderecos-mapa-calor.schema';

const alertIconByTipo: Record<
  AlertaCritico['tipo'],
  { icon: typeof AlertTriangle; border: string; text: string }
> = {
  vencimento: {
    icon: AlertTriangle,
    border: 'border-destructive/20',
    text: 'text-destructive',
  },
  gargalo: {
    icon: Hourglass,
    border: 'border-tertiary/20',
    text: 'text-tertiary',
  },
  ocupacao: {
    icon: Package,
    border: 'border-primary/20',
    text: 'text-primary',
  },
};

function splitCellsBySide(cells: HeatCell[]) {
  const even = cells.filter((c) => {
    const num = parseInt(c.label.split('-')[1] ?? '0', 10);
    return num % 2 === 0;
  });
  const odd = cells.filter((c) => {
    const num = parseInt(c.label.split('-')[1] ?? '0', 10);
    return num % 2 !== 0;
  });
  return { even, odd };
}

export function EnderecosMapaCalorView() {
  const {
    isLoading,
    tabAtiva,
    setTabAtiva,
    ruas,
    ruaSelecionada,
    celulaSelecionada,
    metricas,
    alertas,
    selecionarCelula,
    exportarPdf,
    exportarCsv,
    verTodosAlertas,
  } = useEnderecosMapaCalor();

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <header className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <nav className="mb-2 flex gap-2 text-caption text-muted-foreground">
                <span>Armazém</span>
                <span>/</span>
                <span className="text-primary">Mapas 2D</span>
              </nav>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-primary md:text-headline-lg">
                Mapa de Calor e Ocupação 2D
              </h1>
            </div>
            <div
              className="flex items-center rounded-full bg-muted p-1"
              role="tablist"
              aria-label="Modo de visualização"
            >
              {(Object.keys(MAPA_CALOR_TAB_LABELS) as MapaCalorTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={tabAtiva === tab}
                    onClick={() => setTabAtiva(tab)}
                    className={cn(
                      'rounded-full px-4 py-2 text-label-md transition-all md:px-6',
                      tabAtiva === tab
                        ? 'bg-primary font-bold text-primary-foreground shadow-md'
                        : 'font-medium text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {MAPA_CALOR_TAB_LABELS[tab]}
                  </button>
                ),
              )}
            </div>
          </header>

          <div className="grid grid-cols-12 gap-gutter">
            <div
              className={cn(
                glassPanelClassName,
                'relative col-span-12 overflow-hidden p-4 lg:col-span-9',
              )}
            >
              <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Visualização de Planta
                  </span>
                  <div className="flex items-center gap-1.5 rounded-md border border-outline-variant bg-surface-highest px-2 py-0.5">
                    <span
                      className="size-1.5 rounded-full bg-tertiary"
                      aria-hidden
                    />
                    <span className="text-[10px] text-muted-foreground">
                      Live Update
                    </span>
                  </div>
                </div>
                <HeatmapLegend compact />
              </div>

              <div className="max-h-[360px] overflow-auto rounded-lg border border-outline-variant/30 bg-surface-lowest/50 p-3">
                <div className="space-y-4">
                  {Array.from(ruas.entries()).map(([rua, cells]) => {
                    const { even, odd } = splitCellsBySide(cells);
                    return (
                      <div key={rua} className="space-y-0.5">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-foreground">
                            Rua {rua}
                          </span>
                          <div className="h-px flex-1 bg-outline-variant/30" />
                        </div>
                        <div className="grid grid-cols-12 gap-0.5">
                          {even.map((cell) => (
                            <HeatCellButton
                              key={cell.id}
                              cell={cell}
                              compact
                              selected={celulaSelecionada === cell.id}
                              onSelect={selecionarCelula}
                            />
                          ))}
                        </div>
                        <div className="grid grid-cols-12 gap-0.5 pb-1">
                          {odd.map((cell) => (
                            <HeatCellButton
                              key={cell.id}
                              cell={cell}
                              compact
                              selected={celulaSelecionada === cell.id}
                              onSelect={selecionarCelula}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="col-span-12 space-y-gutter lg:col-span-3">
              <section
                className={cn(
                  glassPanelClassName,
                  'border-l-4 border-l-primary p-5',
                )}
              >
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 className="size-5 text-primary" aria-hidden />
                  <h2 className="text-lg font-bold text-foreground">
                    Rua Selecionada: {ruaSelecionada}
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-caption">
                      <span className="text-muted-foreground">
                        Taxa de Ocupação
                      </span>
                      <span className="text-primary">
                        {metricas.taxaOcupacaoPercent}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-highest">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${metricas.taxaOcupacaoPercent}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-caption">
                      <span className="text-muted-foreground">Giro Médio</span>
                      <span className="text-tertiary">
                        {metricas.giroLabel}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-highest">
                      <div
                        className="h-full bg-tertiary"
                        style={{ width: `${metricas.giroPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/30 pt-4">
                    <div className="text-center">
                      <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">
                        Total Pallets
                      </p>
                      <p className="text-headline-md font-black text-primary">
                        {metricas.totalPallets}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">
                        Pickings/Dia
                      </p>
                      <p className="text-headline-md font-black text-primary">
                        {metricas.pickingsPorDia}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className={cn(glassPanelClassName, 'p-5')}>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">
                    Alertas Críticos
                  </h2>
                  <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                    {String(alertas.length).padStart(2, '0')}
                  </span>
                </div>
                <div className="space-y-3">
                  {alertas.map((alerta) => {
                    const config = alertIconByTipo[alerta.tipo];
                    const Icon = config.icon;
                    return (
                      <div
                        key={alerta.id}
                        className={cn(
                          'flex gap-3 rounded-lg border bg-surface-highest/40 p-3',
                          config.border,
                        )}
                      >
                        <Icon
                          className={cn('size-5 shrink-0', config.text)}
                          aria-hidden
                        />
                        <div>
                          <h3 className="text-label-md font-bold leading-tight text-foreground">
                            {alerta.titulo}
                          </h3>
                          <p className="text-caption text-muted-foreground">
                            {alerta.descricao}
                          </p>
                          <p
                            className={cn(
                              'mt-1 text-[10px] font-bold',
                              config.text,
                            )}
                          >
                            {alerta.detalhe}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={verTodosAlertas}
                  className="mt-6 flex w-full items-center justify-center gap-2 py-2 text-caption font-bold text-muted-foreground transition-colors hover:text-primary"
                >
                  Ver Todos os Alertas
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              </section>

              <section className={cn(sectionCardClassName, 'relative overflow-hidden')}>
                <div className="relative z-10">
                  <h3 className="mb-4 font-bold text-foreground">
                    Exportar Relatório
                  </h3>
                  <p className="mb-4 text-caption text-muted-foreground">
                    Gere um PDF detalhado da ocupação por zona.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={isLoading}
                      onClick={() => void exportarPdf()}
                    >
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Download className="size-4" aria-hidden />
                      )}
                      PDF Consolidado
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={isLoading}
                      onClick={() => void exportarCsv()}
                    >
                      <Clock className="size-4" aria-hidden />
                      CSV Bruto
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="mt-6">
            <Button variant="link" asChild className="px-0">
              <Link href="/enderecos">← Voltar para gestão</Link>
            </Button>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
