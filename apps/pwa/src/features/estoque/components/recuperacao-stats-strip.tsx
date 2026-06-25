import { cn } from '@lilog/ui';
import { CheckCircle2, Clock, PlayCircle } from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import type { RecuperacaoDemandaFilter } from '../types/recuperacao.schema';

const STRIP_ITEMS: {
  id: RecuperacaoDemandaFilter;
  label: string;
  shortLabel: string;
  icon: typeof Clock;
}[] = [
  { id: 'pendente', label: 'Pendentes', shortLabel: 'Pend.', icon: Clock },
  { id: 'em_execucao', label: 'Em execução', shortLabel: 'Exec.', icon: PlayCircle },
  { id: 'finalizada', label: 'Finalizadas', shortLabel: 'Fim', icon: CheckCircle2 },
];

interface RecuperacaoStatsStripProps {
  counts: Record<RecuperacaoDemandaFilter, number>;
  activeFilter: RecuperacaoDemandaFilter;
  onFilterChange: (filter: RecuperacaoDemandaFilter) => void;
}

export function RecuperacaoStatsStrip({
  counts,
  activeFilter,
  onFilterChange,
}: RecuperacaoStatsStripProps) {
  const total = counts.pendente + counts.em_execucao + counts.finalizada;

  return (
    <section
      className="mx-margin-mobile mt-3"
      aria-label="Resumo de demandas por status"
    >
      <div className="relative overflow-hidden rounded-lg bg-primary-container px-3 py-3 text-on-primary-container">
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div>
            <p className="text-label-sm text-on-primary-container/70">
              Fila de recuperação
            </p>
            <p className="font-mono text-headline-md font-bold tabular-nums">
              {total}
              <span className="ml-1 text-body-sm font-normal text-on-primary-container/80">
                demandas
              </span>
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-on-primary-container/10">
            <PlayCircle className="h-5 w-5 text-on-secondary-container" aria-hidden />
          </div>
        </div>

        <div className="relative z-10 mt-3 grid grid-cols-3 gap-2">
          {STRIP_ITEMS.map(({ id, shortLabel, icon: Icon }) => {
            const active = activeFilter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  hapticLight();
                  onFilterChange(id);
                }}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 transition-colors touch-manipulation active:scale-[0.98]',
                  active
                    ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                    : 'bg-on-primary-container/10 text-on-primary-container/90',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="font-mono text-headline-md font-bold leading-none tabular-nums">
                  {counts[id]}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wide">
                  {shortLabel}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-secondary opacity-20 blur-2xl"
          aria-hidden
        />
      </div>
    </section>
  );
}
