'use client';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Filter,
  Gauge,
  Package,
  Receipt,
  Route,
  Scale,
  X,
} from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
} from '@/components/ui/compact-table-classes';

import {
  AdicionaisTipoChart,
  DropsizeRotaChart,
  OcupacaoRotaChart,
  PrevistoVsPagoChart,
  StatusDistribuicaoChart,
  TransportadoraDistribuicaoChart,
} from '@/features/transporte/components/custo-frete-dashboard-charts';
import { CustoFreteInsightCards } from '@/features/transporte/components/custo-frete-insight-cards';
import { CustoFreteSummaryCards } from '@/features/transporte/components/custo-frete-summary-cards';
import { useCustoFreteDashboard } from '@/features/transporte/hooks/use-custo-frete-dashboard';
import { formatarMoeda } from '@/features/transporte/lib/calcular-custo';
import type { FiltroStatusCustoFrete } from '@/features/transporte/types/transporte.schema';
import { STATUS_CUSTO_FRETE_LABELS } from '@/features/transporte/types/transporte.schema';

const STATUS_OPTIONS: { value: FiltroStatusCustoFrete; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  ...(
    Object.entries(STATUS_CUSTO_FRETE_LABELS) as [
      Exclude<FiltroStatusCustoFrete, 'todos'>,
      string,
    ][]
  ).map(([value, label]) => ({ value, label })),
];

const filterInputClass = cn(
  'rounded-lg border border-outline-variant bg-surface-low px-2.5 py-1.5',
  'text-xs text-foreground transition-colors',
  'focus:outline-none focus:ring-1 focus:ring-ring',
);

const indicadorCardClass = cn(
  'group relative overflow-hidden rounded-xl border border-outline-variant',
  'bg-glass-bg px-4 py-3 shadow-inner-glow backdrop-blur-glass',
  'transition-all hover:border-primary/30 hover:shadow-md',
);

type IndicadorCardProps = {
  label: string;
  value: string;
  subValue?: string;
  icon: typeof Gauge;
  accent?: string;
};

function IndicadorCard({
  label,
  value,
  subValue,
  icon: Icon,
  accent = 'text-primary',
}: IndicadorCardProps) {
  return (
    <div className={indicadorCardClass}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 font-mono text-lg font-bold leading-tight text-foreground">
            {value}
          </p>
          {subValue ? (
            <p className="mt-0.5 text-[10px] text-muted-foreground">{subValue}</p>
          ) : null}
        </div>
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-low',
            accent,
          )}
        >
          <Icon className="size-4 opacity-80" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function formatarPeso(valor: number): string {
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`;
}

function formatarPercentual(valor: number): string {
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

export function CustoFreteDashboardView() {
  const {
    filtrados,
    summary,
    insights,
    indicadores,
    graficos,
    rankingTransportadora,
    rankingAdicional,
    transportadoras,
    rotas,
    filtrosAtivos,
    limparFiltros,
    filtroStatus,
    setFiltroStatus,
    filtroTransportadora,
    setFiltroTransportadora,
    filtroRota,
    setFiltroRota,
    filtroData,
    setFiltroData,
  } = useCustoFreteDashboard();

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-5 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-5">
          <nav className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Link href="/transporte" className="hover:text-foreground">
              Transporte
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <span className="text-foreground">Dashboard de Frete</span>
          </nav>

          <header className="relative overflow-hidden rounded-2xl border border-outline-variant bg-glass-bg p-5 shadow-inner-glow backdrop-blur-glass md:p-6">
            <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary/5" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-xl">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  <BarChart3 className="size-3" aria-hidden />
                  Analytics
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                  Dashboard de Frete
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Visão consolidada de custos, ocupação, dropsize e performance
                  por transportadora e rota.
                </p>
              </div>
              <Link
                href="/transporte/custos-frete"
                className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-low px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              >
                <Receipt className="size-3.5" aria-hidden />
                Gestão de Frete
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </header>

          <section className="sticky top-0 z-20 -mx-1 rounded-xl border border-outline-variant bg-surface-highest/90 px-3 py-3 shadow-sm backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Filter className="size-3" aria-hidden />
                Filtros
              </span>

              <select
                className={filterInputClass}
                value={filtroStatus}
                onChange={(event) =>
                  setFiltroStatus(event.target.value as FiltroStatusCustoFrete)
                }
                aria-label="Filtrar por status"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                className={filterInputClass}
                value={filtroTransportadora}
                onChange={(event) => setFiltroTransportadora(event.target.value)}
                aria-label="Filtrar por transportadora"
              >
                <option value="">Todas transportadoras</option>
                {transportadoras.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>

              <select
                className={filterInputClass}
                value={filtroRota}
                onChange={(event) => setFiltroRota(event.target.value)}
                aria-label="Filtrar por rota"
              >
                <option value="">Todas rotas</option>
                {rotas.map((rota) => (
                  <option key={rota} value={rota}>
                    {rota}
                  </option>
                ))}
              </select>

              <input
                type="date"
                className={filterInputClass}
                value={filtroData}
                onChange={(event) => setFiltroData(event.target.value)}
                aria-label="Filtrar por data"
              />

              {filtrosAtivos > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                  onClick={limparFiltros}
                >
                  <X className="size-3" aria-hidden />
                  Limpar ({filtrosAtivos})
                </Button>
              ) : null}
            </div>
          </section>

          <CustoFreteSummaryCards summary={summary} />

          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Indicadores Operacionais
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Eficiência de carga e custo unitário
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <IndicadorCard
                label="Dropsize médio"
                value={formatarPeso(indicadores.dropsizeMedio)}
                subValue="por entrega"
                icon={Package}
                accent="text-secondary"
              />
              <IndicadorCard
                label="Ocupação média"
                value={formatarPercentual(indicadores.ocupacaoMedia)}
                subValue="da capacidade"
                icon={Gauge}
                accent="text-tertiary"
              />
              <IndicadorCard
                label="Custo por kg"
                value={formatarMoeda(indicadores.custoPorKgMedio)}
                subValue="entregue"
                icon={Scale}
                accent="text-primary"
              />
              <IndicadorCard
                label="Custo por km"
                value={formatarMoeda(indicadores.custoPorKmMedio)}
                subValue="rodado"
                icon={Route}
                accent="text-primary"
              />
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Análise Visual
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Comparativos e distribuições dos dados filtrados
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <PrevistoVsPagoChart dados={graficos.previstoVsPagoPorRota} />
              <TransportadoraDistribuicaoChart dados={rankingTransportadora} />
              <OcupacaoRotaChart dados={indicadores.rankingOcupacaoPorRota} />
              <DropsizeRotaChart dados={indicadores.rankingDropsizePorRota} />
              <AdicionaisTipoChart dados={rankingAdicional} />
              <StatusDistribuicaoChart
                dados={graficos.distribuicaoStatus}
                total={filtrados.length}
              />
            </div>
          </section>

          <CustoFreteInsightCards insights={insights} />

          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Detalhamento
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Rankings tabulares para consulta rápida
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-low/30">
                <div className="border-b border-outline-variant px-4 py-3">
                  <h3 className="text-xs font-semibold text-foreground">
                    Por Transportadora
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className={compactTableClassName}>
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-low/80">
                        <th className={compactTableHeadCellClassName()}>
                          Transportadora
                        </th>
                        <th
                          className={compactTableHeadCellClassName('text-right')}
                        >
                          Total
                        </th>
                        <th
                          className={compactTableHeadCellClassName('text-right')}
                        >
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingTransportadora.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className={compactTableEmptyCellClassName}
                          >
                            Nenhum dado.
                          </td>
                        </tr>
                      ) : (
                        rankingTransportadora.map((item) => (
                          <tr
                            key={item.transportadora}
                            className="border-b border-outline-variant/50 last:border-0"
                          >
                            <td className="px-2 py-2">
                              <p className="text-xs font-medium">
                                {item.transportadora}
                              </p>
                              <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-low">
                                <div
                                  className="h-full rounded-full bg-primary/60"
                                  style={{ width: `${item.percentualTotal}%` }}
                                />
                              </div>
                            </td>
                            <td className="px-2 py-2 text-right font-mono text-xs">
                              {formatarMoeda(item.totalPago)}
                            </td>
                            <td className="px-2 py-2 text-right font-mono text-xs text-muted-foreground">
                              {formatarPercentual(item.percentualTotal)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-low/30">
                <div className="border-b border-outline-variant px-4 py-3">
                  <h3 className="text-xs font-semibold text-foreground">
                    Custos Adicionais
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className={compactTableClassName}>
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-low/80">
                        <th className={compactTableHeadCellClassName()}>Tipo</th>
                        <th
                          className={compactTableHeadCellClassName('text-right')}
                        >
                          Qtd
                        </th>
                        <th
                          className={compactTableHeadCellClassName('text-right')}
                        >
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingAdicional.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className={compactTableEmptyCellClassName}
                          >
                            Nenhum adicional.
                          </td>
                        </tr>
                      ) : (
                        rankingAdicional.map((item) => (
                          <tr
                            key={item.tipo}
                            className="border-b border-outline-variant/50 last:border-0"
                          >
                            <td className="px-2 py-2 text-xs font-medium">
                              {item.label}
                            </td>
                            <td className="px-2 py-2 text-right font-mono text-xs">
                              {item.ocorrencias}
                            </td>
                            <td className="px-2 py-2 text-right font-mono text-xs">
                              {formatarMoeda(item.valorTotal)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {filtrados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-variant bg-surface-low/20 px-6 py-12 text-center">
              <p className="text-sm font-medium text-foreground">
                Nenhum transporte encontrado
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ajuste os filtros ou limpe a seleção para ver os dados.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={limparFiltros}
              >
                Limpar filtros
              </Button>
            </div>
          ) : null}
        </div>
      </main>
    </SidebarMain>
  );
}
