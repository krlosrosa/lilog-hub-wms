'use client';

import type { LucideIcon } from 'lucide-react';
import { BarChart3, LineChart, PieChart } from 'lucide-react';

import { cn } from '@lilog/ui';

import type {
  DevolucaoRecente,
  EtapaPipeline,
  MotivoDevolucao,
  PontoHorario,
  ProdutividadeOperacional,
  RotaDashboard,
  RotaStatus,
  TransporteIndicadores,
} from '@/features/dashboard-operacional/types/dashboard-operacional.schema';
import {
  MOTIVO_DEVOLUCAO_LABELS,
  ROTA_STATUS_LABELS,
} from '@/features/dashboard-operacional/types/dashboard-operacional.schema';

const panelClassName =
  'relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md';

type ChartPanelProps = {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  bodyClassName?: string;
};

export function DashboardChartPanel({
  titulo,
  descricao,
  children,
  className,
  icon: Icon = BarChart3,
  bodyClassName,
}: ChartPanelProps) {
  return (
    <section className={cn(panelClassName, 'flex min-h-0 flex-col', className)}>
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-white/5 px-3 py-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/80">
            {titulo}
          </h3>
          {descricao ? (
            <p className="mt-0.5 text-[10px] text-white/35">{descricao}</p>
          ) : null}
        </div>
        <Icon className="size-4 shrink-0 text-white/20" aria-hidden />
      </div>
      <div className={cn('min-h-0 flex-1 p-3', bodyClassName)}>{children}</div>
    </section>
  );
}

type DonutSegment = {
  value: number;
  color: string;
  label: string;
};

function buildConicGradient(segments: DonutSegment[]): string {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return 'conic-gradient(hsl(var(--outline-variant)) 0 100%)';

  let acc = 0;
  const parts = segments.map((seg) => {
    const start = (acc / total) * 100;
    acc += seg.value;
    const end = (acc / total) * 100;
    return `${seg.color} ${start}% ${end}%`;
  });

  return `conic-gradient(${parts.join(', ')})`;
}

export function DonutChart({
  segments,
  centerLabel,
  centerValue,
  size = 120,
  className,
}: {
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
  className?: string;
}) {
  const inner = Math.round(size * 0.62);

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div
        className="relative shrink-0 rounded-full shadow-[0_0_24px_hsl(var(--tertiary)/0.15)]"
        style={{
          width: size,
          height: size,
          background: buildConicGradient(segments),
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[hsl(240_6%_7%)]"
          style={{ width: inner, height: inner }}
        >
          {centerValue ? (
            <span className="text-lg font-bold tabular-nums text-white leading-none">
              {centerValue}
            </span>
          ) : null}
          {centerLabel ? (
            <span className="mt-0.5 text-[9px] uppercase tracking-wider text-white/40">
              {centerLabel}
            </span>
          ) : null}
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {segments.map((seg) => {
          const total = segments.reduce((s, x) => s + x.value, 0);
          const pct = total > 0 ? ((seg.value / total) * 100).toFixed(1) : '0';

          return (
            <li
              key={seg.label}
              className="flex items-center justify-between gap-2 text-[11px]"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-white/60">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: seg.color }}
                />
                <span className="truncate">{seg.label}</span>
              </span>
              <span className="shrink-0 tabular-nums font-semibold text-white/90">
                {seg.value.toLocaleString('pt-BR')}{' '}
                <span className="text-white/35">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function VolumeDistributionDonut({
  entregues,
  devolucoes,
  total,
  className,
}: {
  entregues: number;
  devolucoes: number;
  total: number;
  className?: string;
}) {
  const pendente = Math.max(0, total - entregues - devolucoes);
  const pctEntrega = total > 0 ? ((entregues / total) * 100).toFixed(1) : '0';

  return (
    <DashboardChartPanel
      titulo="Distribuição do Volume"
      descricao="Entregue · pendente · devolvido"
      icon={PieChart}
      className={className}
    >
      <DonutChart
        centerValue={`${pctEntrega}%`}
        centerLabel="entrega"
        segments={[
          {
            value: entregues,
            color: 'hsl(158 64% 45%)',
            label: 'Entregues',
          },
          {
            value: pendente,
            color: 'hsl(220 14% 35%)',
            label: 'Pendentes',
          },
          {
            value: devolucoes,
            color: 'hsl(38 92% 50%)',
            label: 'Devolvidos',
          },
        ]}
      />
    </DashboardChartPanel>
  );
}

const ETAPA_COLORS: Record<string, string> = {
  separacao: 'hsl(var(--primary))',
  conferencia: 'hsl(var(--primary) / 0.85)',
  carregado: 'hsl(var(--tertiary))',
  em_viagem: 'hsl(199 89% 48%)',
  entregue: 'hsl(158 64% 45%)',
  devolvido: 'hsl(38 92% 50%)',
};

const STATUS_COLORS: Record<RotaStatus, string> = {
  em_viagem: 'hsl(199 89% 48%)',
  entregue: 'hsl(158 64% 45%)',
  parcial: 'hsl(38 92% 50%)',
  atrasado: 'hsl(0 72% 55%)',
  aguardando: 'hsl(220 14% 45%)',
};

const MOTIVO_COLORS: Record<MotivoDevolucao, string> = {
  ausente: 'hsl(38 92% 50%)',
  recusa: 'hsl(0 72% 55%)',
  endereco: 'hsl(var(--primary))',
  avaria: 'hsl(25 95% 53%)',
  outro: 'hsl(220 14% 45%)',
};

export function PipelineBarChart({
  etapas,
  className,
}: {
  etapas: EtapaPipeline[];
  className?: string;
}) {
  const max = Math.max(...etapas.map((e) => e.count), 1);

  return (
    <DashboardChartPanel
      titulo="Pipeline Operacional"
      descricao="Volume por etapa"
      className={className}
    >
      <div className="flex h-full min-h-[140px] items-end gap-2">
        {etapas.map((etapa) => {
          const heightPct = (etapa.count / max) * 100;
          const color = ETAPA_COLORS[etapa.id] ?? 'hsl(var(--primary))';

          return (
            <div
              key={etapa.id}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <span className="text-[10px] font-bold tabular-nums text-white/70">
                {etapa.count.toLocaleString('pt-BR')}
              </span>
              <div className="relative w-full flex-1 min-h-[80px] rounded-t-md bg-white/5">
                <div
                  className="absolute bottom-0 w-full rounded-t-md transition-all duration-700"
                  style={{
                    height: `${heightPct}%`,
                    background: color,
                    boxShadow: `0 0 16px ${color}40`,
                  }}
                />
              </div>
              <span className="truncate text-[9px] font-medium uppercase tracking-wide text-white/40">
                {etapa.label}
              </span>
            </div>
          );
        })}
      </div>
    </DashboardChartPanel>
  );
}

export function EntregasHoraAreaChart({
  pontos,
  className,
}: {
  pontos: PontoHorario[];
  className?: string;
}) {
  const max = Math.max(...pontos.map((p) => p.valor), 1);
  const w = 100;
  const h = 100;
  const pad = 4;

  const coords = pontos.map((p, i) => {
    const x =
      pad + (i / Math.max(pontos.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - (p.valor / max) * (h - pad * 2);
    return { x, y, ...p };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
    .join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? pad} ${h - pad} L ${coords[0]?.x ?? pad} ${h - pad} Z`;

  return (
    <DashboardChartPanel
      titulo="Entregas no Turno"
      descricao="Acumulado por hora"
      icon={LineChart}
      className={className}
    >
      <div className="flex h-full min-h-[120px] flex-col">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="flex-1 w-full min-h-[100px]"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="entregas-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--tertiary))" stopOpacity="0.45" />
              <stop offset="100%" stopColor="hsl(var(--tertiary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#entregas-area-fill)" />
          <path
            d={linePath}
            fill="none"
            stroke="hsl(var(--tertiary))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_6px_hsl(var(--tertiary)/0.6)]"
          />
          {coords.map((c) => (
            <circle
              key={c.hora}
              cx={c.x}
              cy={c.y}
              r="2"
              fill="hsl(var(--tertiary))"
            />
          ))}
        </svg>
        <div className="mt-1 flex justify-between text-[9px] text-white/35">
          {pontos.map((p) => (
            <span key={p.hora}>{p.hora}</span>
          ))}
        </div>
      </div>
    </DashboardChartPanel>
  );
}

export function RotasStatusDonut({
  rotas,
  className,
}: {
  rotas: RotaDashboard[];
  className?: string;
}) {
  const counts = rotas.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<RotaStatus, number>,
  );

  const segments: DonutSegment[] = (
    Object.entries(counts) as [RotaStatus, number][]
  ).map(([status, value]) => ({
    value,
    color: STATUS_COLORS[status],
    label: ROTA_STATUS_LABELS[status],
  }));

  return (
    <DashboardChartPanel
      titulo="Status das Rotas"
      descricao={`${rotas.length} largadas`}
      icon={PieChart}
      className={className}
    >
      <DonutChart
        centerValue={String(rotas.length)}
        centerLabel="rotas"
        size={110}
        segments={segments}
      />
    </DashboardChartPanel>
  );
}

export function DevolucoesMotivoChart({
  devolucoes,
  className,
}: {
  devolucoes: DevolucaoRecente[];
  className?: string;
}) {
  const counts = devolucoes.reduce(
    (acc, d) => {
      acc[d.motivo] = (acc[d.motivo] ?? 0) + 1;
      return acc;
    },
    {} as Record<MotivoDevolucao, number>,
  );

  const segments: DonutSegment[] = (
    Object.entries(counts) as [MotivoDevolucao, number][]
  ).map(([motivo, value]) => ({
    value,
    color: MOTIVO_COLORS[motivo],
    label: MOTIVO_DEVOLUCAO_LABELS[motivo],
  }));

  const total = devolucoes.length;

  return (
    <DashboardChartPanel
      titulo="Motivos de Devolução"
      descricao="Distribuição no turno"
      icon={PieChart}
      className={className}
    >
      <DonutChart
        centerValue={String(total)}
        centerLabel="NFs"
        size={110}
        segments={segments}
      />
    </DashboardChartPanel>
  );
}

export function RotasProgressBars({
  rotas,
  className,
  maxItems = 8,
}: {
  rotas: RotaDashboard[];
  className?: string;
  maxItems?: number;
}) {
  const visible = rotas.slice(0, maxItems);

  return (
    <DashboardChartPanel
      titulo="Processo por Rota"
      descricao="Entregas prioritárias"
      className={className}
      bodyClassName="space-y-2"
    >
      {visible.map((rota) => {
        const pctPrioritarias =
          rota.entregasPrioritarias > 0
            ? Math.round(
                (rota.entregasPrioritariasEntregues / rota.entregasPrioritarias) *
                  100,
              )
            : 0;
        const pctEntrega =
          rota.totalNfs > 0
            ? Math.round((rota.entregues / rota.totalNfs) * 100)
            : 0;
        const isAtrasado = rota.status === 'atrasado';
        const prioritariasPendentes =
          rota.entregasPrioritarias - rota.entregasPrioritariasEntregues;
        const prioritariasCriticas =
          isAtrasado && prioritariasPendentes > 0;

        return (
          <div key={rota.id} className="group">
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span
                className={cn(
                  'truncate font-semibold text-white/80',
                  isAtrasado && 'text-red-300',
                )}
              >
                {rota.rota}
              </span>
              <span
                className={cn(
                  'shrink-0 tabular-nums font-semibold',
                  prioritariasCriticas
                    ? 'text-red-300'
                    : pctPrioritarias === 100
                      ? 'text-emerald-400'
                      : 'text-primary',
                )}
              >
                Prioritárias {rota.entregasPrioritariasEntregues}/
                {rota.entregasPrioritarias}
              </span>
            </div>
            <div className="mt-0.5 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700 shadow-[0_0_10px_hsl(var(--primary)/0.45)]',
                  prioritariasCriticas ? 'bg-red-500' : 'bg-primary',
                )}
                style={{ width: `${pctPrioritarias}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[9px] text-white/35">
              <span>
                Total {rota.entregues}/{rota.totalNfs} NFs
                {rota.devolucoes > 0 ? (
                  <span className="text-amber-400/80">
                    {' '}
                    · {rota.devolucoes} dev
                  </span>
                ) : null}
              </span>
              <span className="tabular-nums">{pctEntrega}% geral</span>
            </div>
          </div>
        );
      })}
    </DashboardChartPanel>
  );
}

function corOcupacaoBar(ocupacao: number): string {
  if (ocupacao >= 70) return 'bg-emerald-500';
  if (ocupacao >= 40) return 'bg-sky-400';
  return 'bg-red-500';
}

export function TransporteIndicadoresPanel({
  transporte,
  className,
  maxRotas = 5,
}: {
  transporte: TransporteIndicadores;
  className?: string;
  maxRotas?: number;
}) {
  const ocupacao = transporte.rankingOcupacaoPorRota.slice(0, maxRotas);
  const dropsize = transporte.rankingDropsizePorRota.slice(0, maxRotas);
  const maxDropsize = Math.max(...dropsize.map((d) => d.dropsize), 1);

  return (
    <DashboardChartPanel
      titulo="Transporte"
      descricao="Dropsize e ocupação por rota"
      className={className}
      bodyClassName="space-y-3"
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-black/25 px-3 py-2 text-center">
          <p className="text-[9px] uppercase tracking-wider text-white/40">
            Dropsize médio
          </p>
          <p className="text-xl font-bold tabular-nums text-secondary">
            {transporte.dropsizeMedio.toLocaleString('pt-BR', {
              maximumFractionDigits: 1,
            })}
            <span className="ml-1 text-xs text-white/40">kg</span>
          </p>
        </div>
        <div className="rounded-lg bg-black/25 px-3 py-2 text-center">
          <p className="text-[9px] uppercase tracking-wider text-white/40">
            Ocupação média
          </p>
          <p
            className={cn(
              'text-xl font-bold tabular-nums',
              transporte.ocupacaoMedia >= 70
                ? 'text-emerald-400'
                : transporte.ocupacaoMedia >= 40
                  ? 'text-sky-300'
                  : 'text-red-400',
            )}
          >
            {transporte.ocupacaoMedia.toLocaleString('pt-BR', {
              maximumFractionDigits: 1,
            })}
            <span className="ml-0.5 text-xs text-white/40">%</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/45">
            Ocupação
          </p>
          <div className="space-y-1.5">
            {ocupacao.map((item) => (
              <div key={item.rota}>
                <div className="flex justify-between text-[9px]">
                  <span className="truncate text-white/60">{item.rota}</span>
                  <span className="tabular-nums text-white/80">
                    {item.ocupacao.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      corOcupacaoBar(item.ocupacao),
                    )}
                    style={{ width: `${Math.min(item.ocupacao, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/45">
            Dropsize
          </p>
          <div className="flex h-[88px] items-end justify-between gap-1">
            {dropsize.map((item) => {
              const altura = (item.dropsize / maxDropsize) * 100;
              return (
                <div
                  key={item.rota}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                >
                  <span className="text-[8px] font-bold tabular-nums text-secondary">
                    {item.dropsize.toFixed(0)}
                  </span>
                  <div
                    className="w-full max-w-[28px] rounded-t bg-secondary/70 transition-all"
                    style={{ height: `${Math.max(altura, 12)}%` }}
                  />
                  <span className="w-full truncate text-center text-[8px] text-white/35">
                    {item.rota.replace('R-', '')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardChartPanel>
  );
}

export function ProdutividadeOperacionalPanel({
  produtividade,
  className,
}: {
  produtividade: ProdutividadeOperacional;
  className?: string;
}) {
  const pctGeral =
    produtividade.metaProdutividadeHora > 0
      ? Math.round(
          (produtividade.produtividadeHora /
            produtividade.metaProdutividadeHora) *
            100,
        )
      : 0;
  const atingiuMeta = pctGeral >= 100;

  return (
    <DashboardChartPanel
      titulo="Produtividade Operacional"
      descricao={`Meta do turno · ${produtividade.unidade}`}
      className={className}
      bodyClassName="space-y-2"
    >
      <div className="flex items-center gap-4 rounded-lg bg-black/25 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-wider text-white/40">
            Geral
          </p>
          <p className="text-2xl font-bold tabular-nums text-white">
            {produtividade.produtividadeHora}
            <span className="ml-1 text-sm text-white/35">
              / {produtividade.metaProdutividadeHora}{' '}
              {produtividade.unidade}
            </span>
          </p>
        </div>
        <div
          className={cn(
            'rounded-lg px-2 py-1 text-center text-sm font-bold tabular-nums',
            atingiuMeta
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-amber-500/20 text-amber-300',
          )}
        >
          {pctGeral}%
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            atingiuMeta ? 'bg-emerald-500' : 'bg-amber-500',
          )}
          style={{ width: `${Math.min(pctGeral, 100)}%` }}
        />
      </div>

      <div className="space-y-2">
        {produtividade.setores.map((setor) => {
          const pct =
            setor.metaProdutividadeHora > 0
              ? Math.round(
                  (setor.produtividadeHora / setor.metaProdutividadeHora) * 100,
                )
              : 0;
          const gargalo = setor.saturacaoPercent >= 85;

          return (
            <div key={setor.id}>
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span
                  className={cn(
                    'font-medium text-white/70',
                    gargalo && 'text-amber-300',
                  )}
                >
                  {setor.label}
                  {gargalo ? (
                    <span className="ml-1 text-[8px] text-amber-400/80">
                      gargalo
                    </span>
                  ) : null}
                </span>
                <span className="tabular-nums text-white/50">
                  {setor.produtividadeHora}/{setor.metaProdutividadeHora}{' '}
                  <span className="text-white/30">({pct}%)</span>
                </span>
              </div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    pct >= 100 ? 'bg-emerald-500' : 'bg-primary/80',
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </DashboardChartPanel>
  );
}
