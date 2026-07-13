'use client';

import {
  AlertTriangle,
  Banknote,
  MessageSquareText,
  Package,
} from 'lucide-react';

import { cn } from '@lilog/ui';

import type { CncDetalhe } from '@/features/cnc/types/cnc.schema';
import { CNC_RESPONSAVEL_LABELS } from '@/features/cnc/types/cnc.schema';
import {
  calcularResumoAnomalias,
  formatCncCurrency,
} from '@/features/cnc/lib/cnc-detalhe-utils';

type CncDetalheKpisProps = {
  cnc: CncDetalhe;
};

type KpiItemProps = {
  label: string;
  value: string;
  detail?: string;
  icon: typeof Package;
  accent?: 'default' | 'tertiary' | 'destructive' | 'primary' | 'amber';
};

function KpiItem({
  label,
  value,
  detail,
  icon: Icon,
  accent = 'default',
}: KpiItemProps) {
  const valueColor = {
    default: 'text-foreground',
    tertiary: 'text-tertiary',
    destructive: 'text-destructive',
    primary: 'text-primary',
    amber: 'text-amber-600 dark:text-amber-400',
  }[accent];

  const iconColor = {
    default: 'text-primary',
    tertiary: 'text-tertiary',
    destructive: 'text-destructive',
    primary: 'text-primary',
    amber: 'text-amber-500',
  }[accent];

  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-outline-variant/50',
        'bg-glass-bg px-2 py-1.5 shadow-inner-glow backdrop-blur-glass sm:gap-2 sm:px-2.5',
      )}
    >
      <Icon className={cn('size-3 shrink-0 sm:size-3.5', iconColor)} aria-hidden />
      <p className="min-w-0 truncate text-[10px] leading-none sm:text-[11px]">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="mx-1 text-muted-foreground/40" aria-hidden>
          ·
        </span>
        <span className={cn('font-bold tabular-nums', valueColor)}>{value}</span>
        {detail ? (
          <>
            <span className="mx-1 text-muted-foreground/40" aria-hidden>
              ·
            </span>
            <span className="text-muted-foreground">{detail}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}

export function CncDetalheKpis({ cnc }: CncDetalheKpisProps) {
  const anomalias = calcularResumoAnomalias(cnc.itens);
  const temObservacao = Boolean(cnc.observacao?.trim());

  return (
    <div className="flex flex-nowrap gap-1.5 overflow-x-auto sm:gap-2">
      <KpiItem
        label="Anomalias"
        value={String(anomalias.total)}
        detail={
          anomalias.total > 0
            ? `${anomalias.divergencias} div. · ${anomalias.avarias} avar.`
            : undefined
        }
        icon={Package}
        accent="primary"
      />

      <KpiItem
        label="Observação"
        value={temObservacao ? 'Registrada' : 'Pendente'}
        detail={
          temObservacao
            ? undefined
            : 'Aguardando'
        }
        icon={MessageSquareText}
        accent={temObservacao ? 'default' : 'amber'}
      />

      <KpiItem
        label="Responsável"
        value={CNC_RESPONSAVEL_LABELS[cnc.responsavel]}
        icon={AlertTriangle}
        accent={
          cnc.responsavel === 'indeterminado' ? 'destructive' : 'default'
        }
      />

      <KpiItem
        label="Débito"
        value={formatCncCurrency(cnc.valorDebito)}
        icon={Banknote}
        accent={cnc.valorDebito ? 'tertiary' : 'default'}
      />
    </div>
  );
}
