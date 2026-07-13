'use client';

import { BarChart3, LineChart } from 'lucide-react';

import { cn } from '@lilog/ui';

import { DashboardChartPanel } from '@/features/dashboard-operacional/components/dashboard-charts';
import type {
  PontoRecebimentoHora,
  RankingEmpresaRecebimento,
} from '@/features/recebimento-painel/types/recebimento-painel.schema';

const EMPRESA_COLORS: Record<string, string> = {
  LDB: 'hsl(var(--primary))',
  ITB: 'hsl(var(--tertiary))',
  DPA: 'hsl(199 89% 48%)',
  MXL: 'hsl(38 92% 50%)',
};

export function RecebimentosHoraChart({
  pontos,
  totalPrevistoDia,
  className,
}: {
  pontos: PontoRecebimentoHora[];
  totalPrevistoDia: number;
  className?: string;
}) {
  const w = 100;
  const h = 100;
  const padX = 6;
  const padY = 8;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;
  const slotW = chartW / Math.max(pontos.length, 1);
  const barW = slotW * 0.55;

  let acumulado = 0;
  const pontosEnriquecidos = pontos.map((ponto, index) => {
    acumulado += ponto.finalizados;
    const x = padX + index * slotW + slotW / 2;
    return { ...ponto, acumulado, x };
  });

  const maxAcumulado = pontosEnriquecidos.at(-1)?.acumulado ?? 0;
  const maxY = Math.max(totalPrevistoDia, maxAcumulado, 1);

  const valueToY = (value: number) =>
    padY + chartH - (value / maxY) * chartH;

  const capacidadeY = valueToY(totalPrevistoDia);

  const lineAcumulado = pontosEnriquecidos
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${valueToY(p.acumulado)}`)
    .join(' ');

  const areaAcumulado = `${lineAcumulado} L ${pontosEnriquecidos[pontosEnriquecidos.length - 1]?.x ?? padX} ${padY + chartH} L ${pontosEnriquecidos[0]?.x ?? padX} ${padY + chartH} Z`;

  return (
    <DashboardChartPanel
      titulo="Recebimentos Hora a Hora"
      descricao="Barras por hora · acumulado · capacidade do dia"
      icon={LineChart}
      className={cn('min-h-0', className)}
      bodyClassName="min-h-0 flex-1"
    >
      <div className="flex h-full min-h-0 flex-col gap-1.5">
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-2.5 rounded-sm bg-primary/70" />
            Por hora
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-px w-4 rounded bg-[hsl(var(--tertiary))]" />
            Acumulado
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-px w-4 border-t border-dashed border-white/50"
              aria-hidden
            />
            Capacidade ({totalPrevistoDia})
          </span>
        </div>

        <div className="relative min-h-0 flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex w-6 flex-col justify-between py-1 text-[8px] tabular-nums text-white/25">
            <span>{maxY}</span>
            <span>{Math.round(maxY / 2)}</span>
            <span>0</span>
          </div>

          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="h-full w-full pl-4"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient
                id="recebimento-acumulado-fill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="hsl(var(--tertiary))"
                  stopOpacity="0.35"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--tertiary))"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {pontosEnriquecidos.map((ponto) => {
              const barH =
                ponto.finalizados > 0
                  ? (ponto.finalizados / maxY) * chartH
                  : 0;
              const barX = ponto.x - barW / 2;
              const barY = padY + chartH - barH;

              return (
                <rect
                  key={ponto.hora}
                  x={barX}
                  y={barY}
                  width={barW}
                  height={Math.max(barH, 0)}
                  rx={0.8}
                  fill="hsl(var(--primary) / 0.65)"
                />
              );
            })}

            <path d={areaAcumulado} fill="url(#recebimento-acumulado-fill)" />
            <path
              d={lineAcumulado}
              fill="none"
              stroke="hsl(var(--tertiary))"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <line
              x1={padX}
              y1={capacidadeY}
              x2={w - padX}
              y2={capacidadeY}
              stroke="hsl(220 14% 60%)"
              strokeWidth="0.5"
              strokeDasharray="3 2"
            />
          </svg>
        </div>

        <div className="flex shrink-0 justify-between pl-4 text-[9px] tabular-nums text-white/30">
          {pontos
            .filter((_, i) => i % 2 === 0)
            .map((p) => (
              <span key={p.hora}>{p.hora.slice(0, 5)}</span>
            ))}
        </div>
      </div>
    </DashboardChartPanel>
  );
}

function resolverCorEmpresa(empresa: string): string {
  return EMPRESA_COLORS[empresa] ?? 'hsl(var(--primary))';
}

function RankingEmpresaChart({
  items,
  compact = false,
}: {
  items: RankingEmpresaRecebimento[];
  compact?: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-[11px] text-white/40">
        Sem dados de empresa no período
      </p>
    );
  }

  const maxCarros = Math.max(...items.map((item) => item.qtdCarros), 1);
  const chartH = compact ? 72 : 88;

  return (
    <div className="shrink-0 space-y-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-white/40">
        Quantidade de carros
      </p>

      <div
        className="flex items-end gap-1.5"
        style={{ minHeight: chartH }}
      >
        {items.map((item) => {
          const cor = resolverCorEmpresa(item.empresa);
          const alturaCarros = (item.qtdCarros / maxCarros) * chartH;

          return (
            <div
              key={item.empresa}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <span className="text-[10px] font-bold tabular-nums text-white/70">
                {item.qtdCarros}
              </span>
              <div
                className="flex w-full items-end justify-center"
                style={{ height: chartH }}
              >
                <div
                  className="w-[55%] rounded-t-sm bg-primary/75 transition-all duration-500"
                  style={{
                    height: Math.max(alturaCarros, item.qtdCarros > 0 ? 4 : 0),
                    boxShadow: `0 0 10px ${cor}30`,
                  }}
                  title={`${item.qtdCarros} carros`}
                />
              </div>
              <span className="w-full truncate text-center text-[9px] font-semibold uppercase tracking-wide text-white/50">
                {item.empresa}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RankingEmpresaPanel({
  ranking,
  className,
  compact = false,
}: {
  ranking: RankingEmpresaRecebimento[];
  className?: string;
  compact?: boolean;
}) {
  const rankingPorCarros = [...ranking].sort(
    (a, b) => b.qtdCarros - a.qtdCarros,
  );
  const rankingPorPeso = [...ranking].sort(
    (a, b) => b.volumePeso - a.volumePeso,
  );
  const chartItems = rankingPorCarros.slice(0, compact ? 4 : 5);
  const listaItems = rankingPorPeso.slice(0, compact ? 4 : 8);
  const maxPesoLista = Math.max(
    ...listaItems.map((item) => item.volumePeso),
    1,
  );

  return (
    <DashboardChartPanel
      titulo="Por Empresa"
      descricao="Carros no gráfico · peso na lista"
      icon={BarChart3}
      className={cn('min-h-0', className)}
      bodyClassName="min-h-0 flex-1"
    >
      <div className="flex h-full min-h-0 flex-col gap-2">
        <RankingEmpresaChart items={chartItems} compact={compact} />

        {listaItems.length > 0 ? (
          <div className="min-h-0 flex-1 border-t border-white/5 pt-1.5">
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-white/40">
              Ranking por peso
            </p>
            <ul className="min-h-0 space-y-1.5 overflow-y-auto">
              {listaItems.map((item, index) => {
                const pct = (item.volumePeso / maxPesoLista) * 100;
                const color = resolverCorEmpresa(item.empresa);

                return (
                  <li key={item.empresa}>
                    <div className="mb-0.5 flex items-center justify-between gap-2 text-[10px]">
                      <span className="truncate font-semibold text-white/85">
                        {index + 1}. {item.empresa}
                      </span>
                      <span className="shrink-0 tabular-nums text-white/50">
                        {item.volumePeso.toLocaleString('pt-BR', {
                          maximumFractionDigits: 1,
                        })}{' '}
                        kg
                        <span className="ml-1 text-white/30">
                          ({item.percentualPeso}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </DashboardChartPanel>
  );
}
