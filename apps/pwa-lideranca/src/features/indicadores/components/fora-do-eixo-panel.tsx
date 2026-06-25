import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

import { cn } from '@lilog/ui';

import { PrioridadeBadge } from '@/features/indicadores/components/prioridade-badge';
import { RiscoBadge } from '@/features/indicadores/components/risco-badge';
import { SectionHeader } from '@/features/indicadores/components/section-header';
import { formatarCountdownSaida } from '@/features/indicadores/lib/formatar-tempo';
import type { TransporteRisco } from '@/features/indicadores/lib/torre-controle.schema';
import { hapticLight } from '@/lib/haptics';

type ForaDoEixoPanelProps = {
  transportes: TransporteRisco[];
  onVerTransporte: (transporte: TransporteRisco) => void;
  onVerTodos?: () => void;
  className?: string;
};

export function ForaDoEixoPanel({
  transportes,
  onVerTransporte,
  onVerTodos,
  className,
}: ForaDoEixoPanelProps) {
  if (transportes.length === 0) {
    return (
      <section
        className={cn(
          'rounded-xl border border-outline-variant/80 bg-surface p-3 shadow-sm',
          className,
        )}
      >
        <SectionHeader icon={AlertTriangle} title="Fora do eixo" tone="success" compact />
        <div className="mt-2 flex flex-col items-center rounded-lg bg-tertiary-container/10 px-3 py-4 text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container/30">
            <CheckCircle2 className="h-5 w-5 text-tertiary" aria-hidden />
          </div>
          <p className="text-label-sm font-medium text-on-surface">Tudo dentro do eixo</p>
          <p className="mt-0.5 max-w-[240px] text-[11px] text-on-surface-variant">
            Nenhum transporte prioritário precisa de ação imediata agora.
          </p>
        </div>
      </section>
    );
  }

  const destaques = transportes.slice(0, 5);

  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-destructive/20 bg-surface shadow-sm',
        className,
      )}
    >
      <div className="border-b border-destructive/10 bg-gradient-to-r from-destructive/8 to-transparent px-3 py-2">
        <SectionHeader
          icon={AlertTriangle}
          title="Fora do eixo"
          badge={transportes.length}
          tone="danger"
          compact
          action={
            onVerTodos ? (
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  onVerTodos();
                }}
                className="rounded-full bg-secondary/10 px-3 py-1 text-label-sm font-semibold text-secondary touch-manipulation active:scale-95"
              >
                Ver todos
              </button>
            ) : undefined
          }
        />
      </div>

      <ul className="divide-y divide-outline-variant/50">
        {destaques.map((transporte, index) => (
          <li key={transporte.id}>
            <button
              type="button"
              onClick={() => {
                hapticLight();
                onVerTransporte(transporte);
              }}
              className="group flex w-full items-center gap-2 px-3 py-2.5 text-left touch-manipulation active:bg-surface-container/60"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-destructive/10 font-mono text-[10px] font-bold tabular-nums text-destructive">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-on-surface">
                    {transporte.codigo}
                  </span>
                  <RiscoBadge nivel={transporte.nivelRisco} />
                  {transporte.isPrioridade && transporte.nivelPrioridade ? (
                    <PrioridadeBadge nivel={transporte.nivelPrioridade} />
                  ) : transporte.prioridade ? (
                    <span className="inline-flex rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-secondary ring-1 ring-inset ring-secondary/20">
                      Reentrega
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-[11px] text-on-surface-variant">
                  {transporte.placa} · saída em{' '}
                  <span className="font-semibold tabular-nums text-destructive">
                    {formatarCountdownSaida(transporte.tempoRestanteSaidaMin)}
                  </span>
                </p>
              </div>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-outline transition-transform group-active:translate-x-0.5"
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
