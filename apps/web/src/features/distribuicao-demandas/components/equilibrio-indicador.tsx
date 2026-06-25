import { cn } from '@lilog/ui';

import { distribuicaoLabelClassName } from '@/features/distribuicao-demandas/components/distribuicao-panel-classes';
import type { StatusEquilibrio } from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

const STATUS_CONFIG: Record<
  StatusEquilibrio,
  { label: string; className: string }
> = {
  equilibrado: {
    label: 'Equilibrado',
    className: 'bg-secondary/20 text-secondary-foreground',
  },
  sobrecarregado: {
    label: 'Sobrecarregado',
    className: 'bg-destructive/15 text-destructive',
  },
  abaixo_media: {
    label: 'Abaixo da média',
    className: 'bg-muted text-muted-foreground',
  },
};

export type EquilibrioIndicadorProps = {
  status: StatusEquilibrio;
  desvioPercentual?: number;
  className?: string;
};

export function EquilibrioIndicador({
  status,
  desvioPercentual,
  className,
}: EquilibrioIndicadorProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        config.className,
        className,
      )}
    >
      {config.label}
      {desvioPercentual !== undefined ? (
        <span className="font-mono tabular-nums">
          ({desvioPercentual > 0 ? '+' : ''}
          {desvioPercentual.toFixed(1)}%)
        </span>
      ) : null}
    </span>
  );
}

export function EquilibrioScoreGlobal({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={distribuicaoLabelClassName}>Equilíbrio global</span>
      <span className="font-mono text-sm font-semibold tabular-nums">{score}%</span>
    </div>
  );
}
