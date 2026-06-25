'use client';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type {
  DevolucaoRecente,
  MotivoDevolucao,
} from '@/features/dashboard-operacional/types/dashboard-operacional.schema';
import { MOTIVO_DEVOLUCAO_LABELS } from '@/features/dashboard-operacional/types/dashboard-operacional.schema';

const motivoBadgeClassName: Record<MotivoDevolucao, string> = {
  ausente: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  recusa: 'bg-destructive/15 text-destructive',
  endereco: 'bg-primary/15 text-primary',
  avaria: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  outro: 'bg-muted text-muted-foreground',
};

export type DevolucoesRecentesListProps = {
  devolucoes: DevolucaoRecente[];
  className?: string;
};

export function DevolucoesRecentesList({
  devolucoes,
  className,
}: DevolucoesRecentesListProps) {
  return (
    <section
      className={cn(glassPanelClassName, 'overflow-hidden', className)}
      aria-label="Devoluções recentes"
    >
      <header className="border-b border-outline-variant px-4 py-3 md:px-5">
        <h2 className="text-label-md font-semibold text-foreground">
          Devoluções Recentes
        </h2>
        <p className="mt-1 text-caption text-muted-foreground">
          Últimas devoluções registradas nas rotas do dia
        </p>
      </header>

      <ul className="divide-y divide-outline-variant/30">
        {devolucoes.map((devolucao) => (
          <li
            key={devolucao.id}
            className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-surface-highest/30 md:flex-row md:items-center md:justify-between md:px-5"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium tabular-nums text-foreground">
                  {devolucao.nf}
                </span>
                <span
                  className={cn(
                    'rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                    motivoBadgeClassName[devolucao.motivo],
                  )}
                >
                  {MOTIVO_DEVOLUCAO_LABELS[devolucao.motivo]}
                </span>
              </div>
              <p className="mt-1 truncate text-caption text-muted-foreground">
                {devolucao.cliente}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-caption text-muted-foreground">
              <span>{devolucao.rota}</span>
              <span className="tabular-nums">{devolucao.hora}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
