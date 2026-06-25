import {
  ArrowRight,
  ClipboardCheck,
  Hourglass,
  PackageSearch,
  Truck,
  Workflow,
} from 'lucide-react';

import { cn } from '@lilog/ui';

import { SectionHeader } from '@/features/indicadores/components/section-header';
import type { EtapaOperacional, EtapaPipeline } from '@/features/indicadores/lib/torre-controle.schema';

const ETAPA_ICONS: Record<
  Exclude<EtapaOperacional, 'finalizado'>,
  typeof PackageSearch
> = {
  separacao: PackageSearch,
  conferencia: ClipboardCheck,
  carregamento: Truck,
};

type PipelineResumoCardsProps = {
  pipeline: EtapaPipeline[];
  className?: string;
};

export function PipelineResumoCards({ pipeline, className }: PipelineResumoCardsProps) {
  const etapasOperacionais = pipeline.filter(
    (etapa) => etapa.etapa !== 'finalizado',
  );

  if (etapasOperacionais.length === 0) {
    return null;
  }

  return (
    <section className={cn('space-y-2', className)}>
      <SectionHeader icon={Workflow} title="Pipeline operacional" compact />

      <div className="-mx-margin-mobile overflow-x-auto px-margin-mobile hide-scrollbar">
        <div className="flex min-w-max items-stretch gap-1.5 pb-0.5">
          {etapasOperacionais.map((etapa, index) => {
            const Icon =
              ETAPA_ICONS[etapa.etapa as Exclude<EtapaOperacional, 'finalizado'>] ??
              PackageSearch;
            const isLast = index === etapasOperacionais.length - 1;
            const semPendencia = etapa.qtdMapas === 0;

            return (
              <div key={etapa.etapa} className="flex items-stretch gap-1.5">
                <article
                  className={cn(
                    'relative w-[128px] shrink-0 rounded-xl border bg-surface p-2.5 shadow-sm',
                    etapa.isGargalo
                      ? 'border-destructive/40 bg-destructive/5 ring-1 ring-destructive/25'
                      : semPendencia
                        ? 'border-tertiary/40 bg-tertiary-container/20 ring-1 ring-tertiary/25'
                        : 'border-outline-variant/80',
                  )}
                >
                  {etapa.isGargalo ? (
                    <span className="absolute -top-1.5 left-2 inline-flex items-center gap-0.5 rounded-full border border-destructive/30 bg-destructive px-1.5 py-px text-[8px] font-bold uppercase text-on-destructive shadow-sm">
                      <Hourglass className="h-2.5 w-2.5" aria-hidden />
                      Gargalo
                    </span>
                  ) : null}

                  <div
                    className={cn(
                      'mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg',
                      etapa.isGargalo
                        ? 'bg-destructive/15 text-destructive'
                        : semPendencia
                          ? 'bg-tertiary/15 text-tertiary'
                          : 'bg-secondary/10 text-secondary',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </div>

                  <p className="text-[9px] font-semibold uppercase tracking-wide text-on-surface-variant">
                    {etapa.label}
                  </p>
                  <p className="mt-0.5 font-mono text-title-lg font-bold tabular-nums text-on-surface">
                    {etapa.qtdMapas}
                    <span className="ml-0.5 text-[10px] font-normal text-on-surface-variant">
                      mapas
                    </span>
                  </p>

                  <div className="mt-2 space-y-1 text-[9px]">
                    <div className="flex justify-between gap-2">
                      <span className="text-on-surface-variant">Parado</span>
                      <span className="font-semibold tabular-nums text-on-surface">
                        {etapa.tempoMedioParadoMin} min
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-on-surface-variant">Saturação</span>
                      <span
                        className={cn(
                          'font-semibold tabular-nums',
                          etapa.saturacaoPercent >= 85
                            ? 'text-destructive'
                            : 'text-on-surface',
                        )}
                      >
                        {etapa.saturacaoPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-container">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        etapa.saturacaoPercent >= 85
                          ? 'bg-destructive'
                          : semPendencia
                            ? 'bg-tertiary'
                            : 'bg-secondary',
                      )}
                      style={{ width: `${etapa.saturacaoPercent}%` }}
                    />
                  </div>
                </article>

                {!isLast ? (
                  <div className="flex items-center self-center">
                    <ArrowRight className="h-3.5 w-3.5 text-outline" aria-hidden />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
