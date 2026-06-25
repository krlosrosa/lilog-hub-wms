import { ChevronRight, Truck } from 'lucide-react';

import { cn } from '@lilog/ui';

import { PrioridadeBadge } from '@/features/indicadores/components/prioridade-badge';
import { RiscoBadge } from '@/features/indicadores/components/risco-badge';
import {
  classificarStatusMeta,
  formatarCountdownSaida,
} from '@/features/indicadores/lib/formatar-tempo';
import type { NivelRisco, TransporteRisco } from '@/features/indicadores/lib/torre-controle.schema';
import { ETAPA_OPERACIONAL_LABELS } from '@/features/indicadores/lib/torre-controle.schema';
import { hapticLight } from '@/lib/haptics';

const RISCO_ACCENT: Record<NivelRisco, string> = {
  critico: 'bg-destructive',
  alto: 'bg-warning',
  medio: 'bg-secondary',
  baixo: 'bg-outline-variant',
};

type TransporteRiscoCardProps = {
  transporte: TransporteRisco;
  onClick: () => void;
  className?: string;
};

export function TransporteRiscoCard({
  transporte,
  onClick,
  className,
}: TransporteRiscoCardProps) {
  const statusMeta = classificarStatusMeta(transporte.tempoRestanteSaidaMin);
  const progressoMapas =
    transporte.mapasTotal > 0
      ? Math.round((transporte.mapasConcluidos / transporte.mapasTotal) * 100)
      : 0;

  return (
    <button
      type="button"
      onClick={() => {
        hapticLight();
        onClick();
      }}
      className={cn(
        'group flex w-full items-stretch gap-0 overflow-hidden rounded-xl border border-outline-variant/80 bg-surface text-left shadow-sm touch-manipulation active:scale-[0.99] active:bg-surface-container/40',
        className,
      )}
    >
      <div
        className={cn('w-1 shrink-0', RISCO_ACCENT[transporte.nivelRisco])}
        aria-hidden
      />

      <div className="flex min-w-0 flex-1 items-center gap-2.5 p-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container group-active:bg-surface-container-high">
          <Truck className="h-4 w-4 text-on-surface-variant" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-label-sm font-semibold text-on-surface">
              {transporte.codigo}
            </span>
            <RiscoBadge nivel={transporte.nivelRisco} />
            {transporte.isPrioridade && transporte.nivelPrioridade ? (
              <PrioridadeBadge nivel={transporte.nivelPrioridade} />
            ) : transporte.prioridade ? (
              <span className="inline-flex rounded-full bg-secondary/15 px-1.5 py-px text-[9px] font-semibold text-secondary ring-1 ring-inset ring-secondary/20">
                Reentrega
              </span>
            ) : null}
          </div>

          <p className="truncate text-[11px] text-on-surface-variant">
            {transporte.placa} · {transporte.transportadora}
          </p>

          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="rounded bg-surface-container px-1.5 py-0.5 font-medium text-on-surface-variant">
              {ETAPA_OPERACIONAL_LABELS[transporte.etapaAtual]}
            </span>
            <span
              className={cn(
                'shrink-0 font-semibold tabular-nums',
                statusMeta === 'atrasado'
                  ? 'text-destructive'
                  : statusMeta === 'risco_atraso'
                    ? 'text-warning'
                    : 'text-on-surface',
              )}
            >
              Saída {formatarCountdownSaida(transporte.tempoRestanteSaidaMin)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container">
              <div
                className="h-full rounded-full bg-secondary transition-all"
                style={{ width: `${progressoMapas}%` }}
              />
            </div>
            <span className="shrink-0 text-[9px] font-semibold tabular-nums text-on-surface-variant">
              {transporte.mapasConcluidos}/{transporte.mapasTotal}
            </span>
          </div>
        </div>

        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 self-center text-outline transition-transform group-active:translate-x-0.5"
          aria-hidden
        />
      </div>
    </button>
  );
}
