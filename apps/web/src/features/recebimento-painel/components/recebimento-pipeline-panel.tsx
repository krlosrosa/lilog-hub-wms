'use client';

import { AlertCircle, TrendingUp, Workflow } from 'lucide-react';

import { cn } from '@lilog/ui';

import { DashboardChartPanel } from '@/features/dashboard-operacional/components/dashboard-charts';
import type { PipelineRecebimento } from '@/features/recebimento-painel/types/recebimento-painel.schema';
import type { RecebimentoStatus } from '@/features/recebimento/types/recebimento-lista.schema';

const PIPELINE_STYLES: Record<
  RecebimentoStatus,
  { bar: string; chip: string; ring: string; segment: string }
> = {
  agendado: {
    bar: 'bg-slate-400',
    chip: 'bg-slate-500/15 text-slate-200 ring-slate-400/25',
    ring: 'ring-slate-400/30',
    segment: 'bg-slate-400',
  },
  aguardando: {
    bar: 'bg-amber-500',
    chip: 'bg-amber-500/15 text-amber-300 ring-amber-500/25',
    ring: 'ring-amber-500/35',
    segment: 'bg-amber-500',
  },
  liberado_para_conferencia: {
    bar: 'bg-secondary',
    chip: 'bg-secondary/15 text-secondary ring-secondary/25',
    ring: 'ring-secondary/35',
    segment: 'bg-secondary',
  },
  em_conferencia: {
    bar: 'bg-tertiary',
    chip: 'bg-tertiary/15 text-tertiary ring-tertiary/30',
    ring: 'ring-tertiary/45',
    segment: 'bg-tertiary',
  },
  impedido: {
    bar: 'bg-orange-500',
    chip: 'bg-orange-500/15 text-orange-300 ring-orange-500/25',
    ring: 'ring-orange-500/35',
    segment: 'bg-orange-500',
  },
  conferido: {
    bar: 'bg-amber-400',
    chip: 'bg-amber-400/15 text-amber-200 ring-amber-400/25',
    ring: 'ring-amber-400/30',
    segment: 'bg-amber-400',
  },
  finalizado: {
    bar: 'bg-emerald-500',
    chip: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/25',
    ring: 'ring-emerald-500/30',
    segment: 'bg-emerald-500',
  },
  cancelado: {
    bar: 'bg-destructive',
    chip: 'bg-destructive/15 text-destructive ring-destructive/25',
    ring: 'ring-destructive/30',
    segment: 'bg-destructive',
  },
};

const PIPELINE_SHORT_LABELS: Record<RecebimentoStatus, string> = {
  agendado: 'Agendado',
  aguardando: 'No pátio',
  liberado_para_conferencia: 'Liberado',
  em_conferencia: 'Conferindo',
  impedido: 'Impedido',
  conferido: 'Conferido',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

const ACTIVE_STAGES: RecebimentoStatus[] = [
  'liberado_para_conferencia',
  'em_conferencia',
];

function PipelineEtapaCard({
  etapa,
  index,
}: {
  etapa: PipelineRecebimento;
  index: number;
}) {
  const styles = PIPELINE_STYLES[etapa.situacao];
  const isActive = ACTIVE_STAGES.includes(etapa.situacao);
  const hasItems = etapa.count > 0;

  return (
    <article
      className={cn(
        'flex min-h-[72px] flex-col gap-1 rounded-lg border border-white/[0.08] bg-black/25 p-2',
        hasItems && 'ring-1 ring-inset',
        hasItems && styles.ring,
        isActive && hasItems && 'shadow-[0_0_20px_hsl(var(--tertiary)/0.12)]',
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span
          className={cn(
            'rounded px-1 py-px text-[7px] font-bold uppercase tracking-wider ring-1 ring-inset',
            styles.chip,
          )}
        >
          {index + 1}
        </span>
        {isActive && hasItems ? (
          <span className="size-1.5 animate-pulse rounded-full bg-tertiary" aria-hidden />
        ) : null}
      </div>

      <div>
        <p className="text-xl font-bold tabular-nums leading-none text-white">
          {etapa.count}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10px] font-semibold leading-tight text-white/85">
          {PIPELINE_SHORT_LABELS[etapa.situacao]}
        </p>
      </div>

      <div className="mt-auto">
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn('h-full rounded-full transition-all duration-700', styles.bar)}
            style={{ width: `${Math.max(etapa.percentual, hasItems ? 4 : 0)}%` }}
          />
        </div>
      </div>
    </article>
  );
}

function PipelineInsightsFooter({
  pipeline,
  total,
}: {
  pipeline: PipelineRecebimento[];
  total: number;
}) {
  const finalizados =
    pipeline.find((etapa) => etapa.situacao === 'finalizado')?.count ?? 0;
  const pctConcluido =
    total > 0 ? Math.round((finalizados / total) * 1000) / 10 : 0;

  const pendentesInicio =
    (pipeline.find((e) => e.situacao === 'agendado')?.count ?? 0) +
    (pipeline.find((e) => e.situacao === 'aguardando')?.count ?? 0);

  const emOperacao = pipeline
    .filter((etapa) => ACTIVE_STAGES.includes(etapa.situacao))
    .reduce((sum, etapa) => sum + etapa.count, 0);

  const gargalo = pipeline
    .filter((etapa) => etapa.situacao !== 'finalizado' && etapa.situacao !== 'cancelado')
    .reduce(
      (max, etapa) => (etapa.count > max.count ? etapa : max),
      pipeline[0] ?? { situacao: 'agendado' as const, label: '', count: 0, percentual: 0 },
    );

  const segmentos = pipeline.filter((etapa) => etapa.count > 0);

  return (
    <div className="shrink-0 space-y-2 rounded-lg border border-white/[0.08] bg-black/20 p-2">
      <div className="space-y-1.5">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-white/40">
          Distribuição do dia
        </p>
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          {segmentos.map((etapa) => (
            <span
              key={etapa.situacao}
              className="inline-flex items-center gap-1 text-[9px] text-white/45"
            >
              <span
                className={cn('size-1.5 shrink-0 rounded-full', PIPELINE_STYLES[etapa.situacao].segment)}
                aria-hidden
              />
              {PIPELINE_SHORT_LABELS[etapa.situacao]} ({etapa.count})
            </span>
          ))}
        </div>
      </div>

      <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
        {segmentos.map((etapa) => (
          <div
            key={etapa.situacao}
            className={cn('h-full transition-all duration-700', PIPELINE_STYLES[etapa.situacao].segment)}
            style={{ width: `${etapa.percentual}%` }}
            title={`${PIPELINE_SHORT_LABELS[etapa.situacao]}: ${etapa.count}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        <InsightPill
          icon={TrendingUp}
          label="Taxa conclusão"
          value={`${pctConcluido.toLocaleString('pt-BR')}%`}
          detail={`${finalizados} de ${total} carros`}
          accent="text-tertiary"
        />
        <InsightPill
          icon={AlertCircle}
          label="Gargalo atual"
          value={PIPELINE_SHORT_LABELS[gargalo.situacao]}
          detail={`${gargalo.count} veículo${gargalo.count === 1 ? '' : 's'}`}
          accent="text-amber-400"
        />
        <InsightPill
          icon={Workflow}
          label="Fila operacional"
          value={String(emOperacao + pendentesInicio)}
          detail={`${emOperacao} ativos · ${pendentesInicio} aguardando`}
          accent="text-primary"
        />
      </div>
    </div>
  );
}

function InsightPill({
  icon: Icon,
  label,
  value,
  detail,
  accent,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  detail: string;
  accent: string;
}) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-1.5 text-center">
      <div className="mb-0.5 flex items-center justify-center gap-1 text-[7px] font-medium uppercase tracking-wider text-white/35">
        <Icon className="size-2.5 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
      </div>
      <p className={cn('truncate text-xs font-bold text-white', accent)}>{value}</p>
      <p className="mt-0.5 truncate text-[8px] text-white/35">{detail}</p>
    </div>
  );
}

export function RecebimentoPipelinePanel({
  pipeline,
  className,
}: {
  pipeline: PipelineRecebimento[];
  className?: string;
}) {
  const total = pipeline.reduce((sum, etapa) => sum + etapa.count, 0);
  const emOperacao = pipeline
    .filter((etapa) => ACTIVE_STAGES.includes(etapa.situacao))
    .reduce((sum, etapa) => sum + etapa.count, 0);
  const finalizados =
    pipeline.find((etapa) => etapa.situacao === 'finalizado')?.count ?? 0;

  return (
    <DashboardChartPanel
      titulo="Pipeline do Dia"
      descricao={`${total} veículos · ${emOperacao} em operação · ${finalizados} finalizados`}
      icon={Workflow}
      className={cn('min-h-0', className)}
      bodyClassName="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2"
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {pipeline.map((etapa, index) => (
            <PipelineEtapaCard key={etapa.situacao} etapa={etapa} index={index} />
          ))}
        </div>
      </div>

      <PipelineInsightsFooter pipeline={pipeline} total={total} />
    </DashboardChartPanel>
  );
}
