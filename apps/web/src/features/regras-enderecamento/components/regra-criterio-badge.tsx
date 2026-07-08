import { cn } from '@lilog/ui';

import {
  getCriterioTipoLabel,
  type RegraEnderecamentoFormValues,
} from '@/features/regras-enderecamento/types/regra-enderecamento.schema';

const CRITERIO_STYLES: Record<
  RegraEnderecamentoFormValues['criterioTipo'],
  string
> = {
  grupo: 'bg-primary/10 text-primary border-primary/20',
  categoria: 'bg-secondary/10 text-secondary border-secondary/20',
  produto: 'bg-tertiary/10 text-tertiary border-tertiary/20',
};

type RegraCriterioBadgeProps = {
  criterioTipo: RegraEnderecamentoFormValues['criterioTipo'];
  criterioValor: string;
  compact?: boolean;
  muted?: boolean;
};

export function RegraCriterioBadge({
  criterioTipo,
  criterioValor,
  compact = false,
  muted = false,
}: RegraCriterioBadgeProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', muted && 'opacity-60')}>
      <span
        className={cn(
          'inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
          CRITERIO_STYLES[criterioTipo],
          compact && 'text-[9px]',
        )}
      >
        {getCriterioTipoLabel(criterioTipo)}
      </span>
      <span
        className={cn(
          'font-mono text-xs text-foreground',
          compact && 'text-[11px]',
        )}
      >
        {criterioValor}
      </span>
    </div>
  );
}
