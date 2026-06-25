'use client';

import { cn } from '@lilog/ui';
import {
  DollarSign,
  Layers,
  Route,
  Snowflake,
  Truck,
} from 'lucide-react';

import { formatarMoeda } from '@/features/transporte/lib/calcular-custo';
import type { TipoCargaFiltro } from '@/features/transporte/hooks/use-perfis-tarifas';
import type { TipoCarga } from '@/features/transporte/types/perfil-tarifa.schema';
import { TIPO_CARGA_LABELS } from '@/features/transporte/types/perfil-tarifa.schema';

type PerfisTarifasSummaryProps = {
  totalPerfis: number;
  menorTarifaInicio: number;
  maiorTarifa: number;
  totalFaixas: number;
  tipoCargaFiltro: TipoCargaFiltro;
  className?: string;
};

const cardClass = cn(
  'group relative overflow-hidden rounded-xl border border-outline-variant',
  'bg-glass-bg px-4 py-3 shadow-inner-glow backdrop-blur-glass',
  'transition-all hover:border-primary/25 hover:shadow-md',
);

type StatCardProps = {
  label: string;
  value: string;
  subValue?: string;
  icon: typeof Truck;
  accent?: 'default' | 'primary' | 'tertiary' | 'secondary';
};

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  accent = 'default',
}: StatCardProps) {
  const iconColor = {
    default: 'text-primary bg-primary/10',
    primary: 'text-primary bg-primary/10',
    tertiary: 'text-tertiary bg-tertiary/10',
    secondary: 'text-secondary bg-secondary/10',
  }[accent];

  const valueColor = {
    default: 'text-foreground',
    primary: 'text-primary',
    tertiary: 'text-tertiary',
    secondary: 'text-secondary',
  }[accent];

  return (
    <div className={cardClass}>
      <Icon
        className={cn(
          'pointer-events-none absolute -right-2 -top-2 size-10 opacity-[0.06]',
          iconColor.split(' ')[0],
        )}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              'mt-1 font-mono text-lg font-bold leading-tight',
              valueColor,
            )}
          >
            {value}
          </p>
          {subValue ? (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {subValue}
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            iconColor,
          )}
        >
          <Icon className="size-4" aria-hidden />
        </div>
      </div>
    </div>
  );
}

export function PerfisTarifasSummary({
  totalPerfis,
  menorTarifaInicio,
  maiorTarifa,
  totalFaixas,
  tipoCargaFiltro,
  className,
}: PerfisTarifasSummaryProps) {
  const refrigerado = tipoCargaFiltro === 'refrigerado';
  const CargaIcon = tipoCargaFiltro === 'refrigerado'
    ? Snowflake
    : tipoCargaFiltro === 'seco'
      ? Truck
      : Layers;

  return (
    <div className={cn('grid grid-cols-2 gap-2 lg:grid-cols-4', className)}>
      <StatCard
        label="Perfis configurados"
        value={String(totalPerfis)}
        subValue={
          tipoCargaFiltro
            ? TIPO_CARGA_LABELS[tipoCargaFiltro]
            : 'Todos os tipos'
        }
        icon={CargaIcon}
        accent={refrigerado ? 'secondary' : tipoCargaFiltro === 'seco' ? 'tertiary' : 'default'}
      />
      <StatCard
        label="Menor tarifa (0 km)"
        value={formatarMoeda(menorTarifaInicio)}
        subValue="Faixa inicial"
        icon={DollarSign}
        accent="default"
      />
      <StatCard
        label="Maior tarifa"
        value={formatarMoeda(maiorTarifa)}
        subValue="Entre todos os perfis"
        icon={Route}
        accent="primary"
      />
      <StatCard
        label="Faixas configuradas"
        value={String(totalFaixas)}
        subValue="Total de faixas de km"
        icon={Layers}
        accent="default"
      />
    </div>
  );
}
