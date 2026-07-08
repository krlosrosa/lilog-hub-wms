'use client';



import { cn } from '@lilog/ui';

import {

  Container,

  DollarSign,

  Gauge,

  Package,

  Route,

  Scale,

  Truck,

} from 'lucide-react';



import { formatarMoeda } from '@/features/transporte/lib/calcular-custo';

import type { TransporteSummary } from '@/features/transporte/types/transporte.schema';



const nf = new Intl.NumberFormat('pt-BR');



type TransporteSummaryCardsProps = {

  summary: TransporteSummary;

  className?: string;

};



type StatItem = {

  label: string;

  value: string;

  subValue?: string;

  title?: string;

  accent?: 'default' | 'destructive' | 'tertiary' | 'secondary' | 'primary';

  icon: typeof Package;

};



function formatarPesoTon(pesoKg: number): string {

  const toneladas = pesoKg / 1000;

  return `${toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} t`;

}



function formatarPesoKg(pesoKg: number): string {

  return `${pesoKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg`;

}



function formatarPercentual(valor: number): string {

  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

}



function rotuloComPlaca(transportesComPlaca: number): string {

  if (transportesComPlaca <= 0) {

    return 'Nenhum com placa alocada';

  }



  return `${nf.format(transportesComPlaca)} com placa alocada`;

}



export function TransporteSummaryCards({

  summary,

  className,

}: TransporteSummaryCardsProps) {

  const baseComPlaca = rotuloComPlaca(summary.transportesComPlaca);



  const items: StatItem[] = [

    {

      label: 'Remessas',

      value: nf.format(summary.totalRemessas),

      icon: Package,

    },

    {

      label: 'Transportes',

      value: nf.format(summary.totalTransportes),

      subValue:

        summary.totalRemessas > 0

          ? `${nf.format(summary.totalRemessas)} remessa${summary.totalRemessas === 1 ? '' : 's'}`

          : undefined,

      title: 'Rotas/grupos de transporte no período filtrado',

      icon: Route,

    },

    {

      label: 'Pendentes',

      value: nf.format(summary.transportesPendentes),

      accent: 'destructive',

      icon: Container,

    },

    {

      label: 'Alocadas',

      value: nf.format(summary.placasAlocadas),

      accent: 'tertiary',

      icon: Truck,

    },

    {

      label: 'Custo previsto',

      value: formatarMoeda(summary.custoPrevistoTotal),

      title: 'Soma do custo previsto de frete no período filtrado',

      accent: 'primary',

      icon: DollarSign,

    },

    {

      label: 'R$/Ton',

      value: summary.custoPorTon > 0 ? formatarMoeda(summary.custoPorTon) : '—',

      subValue:

        summary.transportesComPlaca > 0 && summary.pesoTotalKg > 0

          ? `${baseComPlaca} · ${formatarPesoTon(summary.pesoTotalKg)}`

          : baseComPlaca,

      title:

        'Custo previsto ÷ peso em toneladas — apenas transportes com placa alocada',

      accent: 'primary',

      icon: Scale,

    },

    {

      label: 'Dropsize',

      value:

        summary.dropsizeMedio > 0

          ? formatarPesoKg(summary.dropsizeMedio)

          : '—',

      subValue:

        summary.transportesComPlaca > 0 && summary.totalEntregas > 0

          ? `${baseComPlaca} · ${nf.format(summary.totalEntregas)} cliente${summary.totalEntregas === 1 ? '' : 's'}`

          : baseComPlaca,

      title:

        'Peso médio por cliente (entrega) — apenas transportes com placa alocada',

      accent: 'secondary',

      icon: Package,

    },

    {

      label: 'Ocupação',

      value:

        summary.ocupacaoMedia > 0

          ? formatarPercentual(summary.ocupacaoMedia)

          : '—',

      subValue:

        summary.transportesComPlaca > 0

          ? `${baseComPlaca} · da capacidade`

          : baseComPlaca,

      title:

        'Ocupação média ponderada por peso — apenas transportes com placa alocada',

      accent: 'tertiary',

      icon: Gauge,

    },

  ];



  const valueColor: Record<NonNullable<StatItem['accent']>, string> = {

    default: 'text-foreground',

    destructive: 'text-destructive',

    tertiary: 'text-tertiary',

    secondary: 'text-secondary',

    primary: 'text-primary',

  };



  return (

    <div

      className={cn('grid grid-cols-2 gap-2 sm:grid-cols-4', className)}

    >

      {items.map((item) => {

        const Icon = item.icon;

        const accent = item.accent ?? 'default';



        return (

          <div

            key={item.label}

            title={item.title}

            className={cn(

              'group relative overflow-hidden rounded-lg border border-outline-variant',

              'bg-glass-bg px-3 py-2.5 shadow-inner-glow backdrop-blur-glass',

              'transition-colors hover:border-primary/25',

              accent === 'tertiary' && 'border-tertiary/20',

              accent === 'primary' && 'border-primary/20',

              accent === 'secondary' && 'border-secondary/20',

            )}

          >

            <Icon

              className={cn(

                'pointer-events-none absolute -right-1 -top-1 size-8 opacity-[0.08]',

                accent === 'tertiary'

                  ? 'text-tertiary'

                  : accent === 'destructive'

                    ? 'text-destructive'

                    : accent === 'secondary'

                      ? 'text-secondary'

                      : 'text-primary',

              )}

              aria-hidden

            />

            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">

              {item.label}

            </p>

            <p

              className={cn(

                'mt-0.5 truncate font-mono text-sm font-bold leading-tight',

                valueColor[accent],

              )}

            >

              {item.value}

            </p>

            {item.subValue ? (

              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">

                {item.subValue}

              </p>

            ) : null}

          </div>

        );

      })}

    </div>

  );

}


