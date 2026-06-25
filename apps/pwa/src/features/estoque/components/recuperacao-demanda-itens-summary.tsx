import { cn } from '@lilog/ui';
import { CheckCircle2, Clock, MapPin, Package } from 'lucide-react';

import type { RecuperacaoDemanda } from '../types/recuperacao.schema';

const STATUS_LABEL: Record<RecuperacaoDemanda['status'], string> = {
  pendente: 'Pendente',
  em_execucao: 'Em execução',
  finalizada: 'Finalizada',
};

interface RecuperacaoDemandaItensSummaryProps {
  demanda: RecuperacaoDemanda;
  totalItens: number;
  pendentes: number;
  concluidos: number;
  progressPercent: number;
}

export function RecuperacaoDemandaItensSummary({
  demanda,
  totalItens,
  pendentes,
  concluidos,
  progressPercent,
}: RecuperacaoDemandaItensSummaryProps) {
  const showProgress =
    demanda.status === 'em_execucao' || demanda.status === 'finalizada';

  return (
    <section
      className="mx-margin-mobile mt-3"
      aria-label="Resumo da demanda"
    >
      <div className="relative overflow-hidden rounded-lg bg-primary-container px-3 py-3 text-on-primary-container">
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-label-sm text-on-primary-container/70">
              Localização
            </p>
            <p className="flex items-center gap-1 font-mono text-headline-md font-bold tabular-nums">
              <MapPin
                className="h-4 w-4 shrink-0 text-on-secondary-container"
                aria-hidden
              />
              {demanda.localizacao}
            </p>
            <p className="mt-0.5 line-clamp-1 text-body-sm text-on-primary-container/80">
              {demanda.titulo}
            </p>
          </div>

          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-label-sm font-semibold',
              demanda.status === 'finalizada'
                ? 'bg-on-primary-container/15 text-on-primary-container'
                : 'bg-secondary-container text-on-secondary-container',
            )}
          >
            {STATUS_LABEL[demanda.status]}
          </span>
        </div>

        <div className="relative z-10 mt-3 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-0.5 rounded-lg bg-on-primary-container/10 px-2 py-2">
            <Package className="h-3.5 w-3.5 text-on-secondary-container" aria-hidden />
            <span className="font-mono text-headline-md font-bold leading-none tabular-nums">
              {totalItens}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-on-primary-container/70">
              SKUs
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-lg bg-on-primary-container/10 px-2 py-2">
            <Clock className="h-3.5 w-3.5 text-on-secondary-container" aria-hidden />
            <span className="font-mono text-headline-md font-bold leading-none tabular-nums">
              {pendentes}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-on-primary-container/70">
              Pend.
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-lg bg-on-primary-container/10 px-2 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-on-secondary-container" aria-hidden />
            <span className="font-mono text-headline-md font-bold leading-none tabular-nums">
              {concluidos}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-on-primary-container/70">
              OK
            </span>
          </div>
        </div>

        {showProgress && (
          <div className="relative z-10 mt-3">
            <div className="mb-1.5 flex justify-between text-label-sm text-on-primary-container/70">
              <span>Progresso da demanda</span>
              <span className="font-mono font-semibold tabular-nums text-on-primary-container">
                {progressPercent}%
              </span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-on-primary-container/15"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso ${progressPercent}%`}
            >
              <div
                className="h-full rounded-full bg-secondary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div
          className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-secondary opacity-20 blur-2xl"
          aria-hidden
        />
      </div>
    </section>
  );
}
