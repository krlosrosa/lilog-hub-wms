import { cn } from '@lilog/ui';

import {
  URGENCIA_SAIDA_CLASSES,
  classificarUrgenciaSaida,
  formatarDuracaoSegundos,
  formatarDuracaoSegundosInline,
  obterSegundosAtrasoExpedicao,
  resolverTempoRestanteExpedicaoSeg,
} from '@/features/torre-controle-expedicao/lib/formatar-tempo';

type TempoExpedicaoBaseProps = {
  tempoRestanteSaidaMin: number;
  tempoRestanteSaidaSeg?: number;
  className?: string;
};

type TempoRestanteExpedicaoProps = TempoExpedicaoBaseProps & {
  compact?: boolean;
  vazioQuandoAtrasado?: boolean;
};

const tempoInlineClassName =
  'whitespace-nowrap text-[11px] font-semibold tabular-nums leading-none';

export function BadgeAtrasoExpedicao({
  tempoRestanteSaidaMin,
  tempoRestanteSaidaSeg,
  className,
}: TempoExpedicaoBaseProps) {
  const atrasoSeg = obterSegundosAtrasoExpedicao(
    tempoRestanteSaidaMin,
    tempoRestanteSaidaSeg,
  );

  if (atrasoSeg <= 0) {
    return (
      <span className={cn('text-[11px] text-muted-foreground/70', className)}>
        —
      </span>
    );
  }

  return (
    <span
      className={cn(tempoInlineClassName, 'text-destructive', className)}
    >
      {formatarDuracaoSegundosInline(atrasoSeg)}
    </span>
  );
}

export function TempoRestanteExpedicao({
  tempoRestanteSaidaMin,
  tempoRestanteSaidaSeg,
  className,
  compact = false,
  vazioQuandoAtrasado = true,
}: TempoRestanteExpedicaoProps) {
  const totalSeg = resolverTempoRestanteExpedicaoSeg(
    tempoRestanteSaidaMin,
    tempoRestanteSaidaSeg,
  );

  if (totalSeg < 0) {
    if (!vazioQuandoAtrasado) {
      return (
        <BadgeAtrasoExpedicao
          tempoRestanteSaidaMin={tempoRestanteSaidaMin}
          tempoRestanteSaidaSeg={tempoRestanteSaidaSeg}
          className={className}
        />
      );
    }

    return (
      <span className={cn('text-[11px] text-muted-foreground/70', className)}>
        —
      </span>
    );
  }

  const urgencia = classificarUrgenciaSaida(tempoRestanteSaidaMin);
  const formatar = compact ? formatarDuracaoSegundosInline : formatarDuracaoSegundos;

  if (compact) {
    return (
      <span
        className={cn(
          tempoInlineClassName,
          URGENCIA_SAIDA_CLASSES[urgencia],
          className,
        )}
      >
        {formatar(totalSeg)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex flex-col tabular-nums',
        URGENCIA_SAIDA_CLASSES[urgencia],
        className,
      )}
    >
      <span>{formatar(totalSeg)}</span>
      <span className="text-[9px] font-medium normal-case text-muted-foreground">
        até meta
      </span>
    </span>
  );
}

export function resumoTempoRestanteExpedicao(
  tempoRestanteSaidaMin: number,
  tempoRestanteSaidaSeg?: number,
): string {
  const totalSeg = resolverTempoRestanteExpedicaoSeg(
    tempoRestanteSaidaMin,
    tempoRestanteSaidaSeg,
  );

  if (totalSeg < 0) {
    return '—';
  }

  return `${formatarDuracaoSegundosInline(totalSeg)} até meta`;
}

export function resumoAtrasoExpedicao(
  tempoRestanteSaidaMin: number,
  tempoRestanteSaidaSeg?: number,
): string | null {
  const atrasoSeg = obterSegundosAtrasoExpedicao(
    tempoRestanteSaidaMin,
    tempoRestanteSaidaSeg,
  );

  if (atrasoSeg <= 0) {
    return null;
  }

  return formatarDuracaoSegundosInline(atrasoSeg);
}
