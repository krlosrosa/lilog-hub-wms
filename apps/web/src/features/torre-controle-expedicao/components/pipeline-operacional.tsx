'use client';

import { ArrowRight, Hourglass } from 'lucide-react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { EtapaPipeline } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

export type PipelineEtapaCardProps = {
  etapa: EtapaPipeline;
  onClick: () => void;
};

export function PipelineEtapaCard({ etapa, onClick }: PipelineEtapaCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        glassPanelClassName,
        'relative flex w-full flex-col rounded-xl p-4 text-left transition-all hover:border-primary/40',
        etapa.isGargalo &&
          'ring-2 ring-destructive/40 ring-offset-2 ring-offset-background',
      )}
    >
      {etapa.isGargalo ? (
        <span className="absolute -top-2 right-3 inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/15 px-2 py-0.5 text-[9px] font-bold uppercase text-destructive">
          <Hourglass className="size-3" aria-hidden />
          Gargalo
        </span>
      ) : null}

      <p className="text-caption font-medium uppercase text-muted-foreground">
        {etapa.label}
      </p>
      <p className="mt-1 text-headline-md font-bold tabular-nums text-foreground">
        {etapa.qtdMapas}
        <span className="ml-1 text-xs font-normal text-muted-foreground">mapas</span>
      </p>

      <dl className="mt-3 space-y-1.5 text-caption">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Tempo parado</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {etapa.tempoMedioParadoMin} min
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Volume acum.</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {etapa.volumeAcumuladoPaletes} plts
          </dd>
        </div>
      </dl>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[10px]">
          <span className="text-muted-foreground">Saturação</span>
          <span
            className={cn(
              'font-semibold tabular-nums',
              etapa.saturacaoPercent >= 85
                ? 'text-destructive'
                : 'text-foreground',
            )}
          >
            {etapa.saturacaoPercent}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              etapa.saturacaoPercent >= 85 ? 'bg-destructive' : 'bg-primary',
            )}
            style={{ width: `${etapa.saturacaoPercent}%` }}
          />
        </div>
      </div>
    </button>
  );
}

export type PipelineOperacionalProps = {
  etapas: EtapaPipeline[];
  onEtapaClick: (etapa: EtapaPipeline['etapa']) => void;
  className?: string;
};

export function PipelineOperacional({
  etapas,
  onEtapaClick,
  className,
}: PipelineOperacionalProps) {
  return (
    <section
      id="pipeline-operacional"
      className={cn(glassPanelClassName, 'rounded-xl p-4 md:p-6', className)}
    >
      <h2 className="mb-4 text-label-md font-semibold text-foreground">
        Pipeline Operacional
      </h2>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {etapas.map((etapa, index) => (
          <div key={etapa.etapa} className="flex flex-1 items-center gap-2">
            <PipelineEtapaCard
              etapa={etapa}
              onClick={() => onEtapaClick(etapa.etapa)}
            />
            {index < etapas.length - 1 ? (
              <ArrowRight
                className="hidden size-5 shrink-0 text-muted-foreground lg:block"
                aria-hidden
              />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
