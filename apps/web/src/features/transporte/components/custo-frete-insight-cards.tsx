'use client';

import { cn } from '@lilog/ui';
import {
  AlertTriangle,
  Building2,
  MapPinned,
  Receipt,
  Route,
  Tags,
  Truck,
  type LucideIcon,
} from 'lucide-react';

import { formatarMoeda } from '@/features/transporte/lib/calcular-custo';
import type { CustoFreteInsights } from '@/features/transporte/types/transporte.schema';

type CustoFreteInsightCardsProps = {
  insights: CustoFreteInsights;
  className?: string;
};

type InsightCardProps = {
  titulo: string;
  destaque: string;
  valor?: string;
  detalhe?: string;
  icon: LucideIcon;
  accent?: 'default' | 'tertiary' | 'destructive' | 'secondary';
};

const accentStyles = {
  default: {
    border: 'hover:border-primary/25',
    icon: 'text-primary',
    value: 'text-foreground',
  },
  tertiary: {
    border: 'border-tertiary/20 hover:border-tertiary/35',
    icon: 'text-tertiary',
    value: 'text-tertiary',
  },
  destructive: {
    border: 'border-destructive/20 hover:border-destructive/35',
    icon: 'text-destructive',
    value: 'text-destructive',
  },
  secondary: {
    border: 'border-secondary/20 hover:border-secondary/35',
    icon: 'text-secondary',
    value: 'text-secondary',
  },
} as const;

function InsightCard({
  titulo,
  destaque,
  valor,
  detalhe,
  icon: Icon,
  accent = 'default',
}: InsightCardProps) {
  const styles = accentStyles[accent];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-outline-variant',
        'bg-glass-bg px-3 py-2.5 shadow-inner-glow backdrop-blur-glass transition-colors',
        styles.border,
      )}
    >
      <Icon
        className={cn(
          'pointer-events-none absolute -right-1 -top-1 size-8 opacity-[0.08]',
          styles.icon,
        )}
        aria-hidden
      />
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>
      <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
        {destaque}
      </p>
      {valor ? (
        <p className={cn('mt-0.5 font-mono text-sm font-bold leading-tight', styles.value)}>
          {valor}
        </p>
      ) : null}
      {detalhe ? (
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{detalhe}</p>
      ) : null}
    </div>
  );
}

export function CustoFreteInsightCards({
  insights,
  className,
}: CustoFreteInsightCardsProps) {
  const variacaoPositiva = insights.rotaMaiorVariacao.variacaoPercentual >= 0;
  const percentualVariacao = `${variacaoPositiva ? '+' : ''}${insights.rotaMaiorVariacao.variacaoPercentual.toFixed(1)}%`;

  const cards: InsightCardProps[] = [
    {
      titulo: 'Maior custo por transportadora',
      destaque: insights.transportadoraMaiorCusto.label,
      valor: formatarMoeda(insights.transportadoraMaiorCusto.valor),
      detalhe: `${insights.transportadoraMaiorCusto.transportes} transporte${insights.transportadoraMaiorCusto.transportes === 1 ? '' : 's'}`,
      icon: Truck,
      accent: 'default',
    },
    {
      titulo: 'Rota com maior variação',
      destaque: insights.rotaMaiorVariacao.label,
      valor: `${variacaoPositiva ? '+' : ''}${formatarMoeda(insights.rotaMaiorVariacao.valor)}`,
      detalhe: percentualVariacao,
      icon: Route,
      accent:
        Math.abs(insights.rotaMaiorVariacao.variacaoPercentual) > 15
          ? 'destructive'
          : Math.abs(insights.rotaMaiorVariacao.variacaoPercentual) > 5
            ? 'secondary'
            : 'tertiary',
    },
    {
      titulo: 'Cliente com maior adicional',
      destaque: insights.clienteMaiorAdicional.label,
      valor: formatarMoeda(insights.clienteMaiorAdicional.valor),
      detalhe: `Rota ${insights.clienteMaiorAdicional.rota}`,
      icon: Building2,
      accent: 'secondary',
    },
    {
      titulo: 'Tipo adicional mais frequente',
      destaque: insights.tipoAdicionalMaisFrequente.label,
      valor: formatarMoeda(insights.tipoAdicionalMaisFrequente.valor),
      detalhe: `${insights.tipoAdicionalMaisFrequente.ocorrencias} lançamento${insights.tipoAdicionalMaisFrequente.ocorrencias === 1 ? '' : 's'}`,
      icon: Tags,
      accent: 'default',
    },
    {
      titulo: 'Rota com maior adicional',
      destaque: insights.rotaMaiorAdicional.label,
      valor: formatarMoeda(insights.rotaMaiorAdicional.valor),
      detalhe: insights.rotaMaiorAdicional.detalhe,
      icon: MapPinned,
      accent: 'tertiary',
    },
    {
      titulo: 'Custos contestados',
      destaque:
        insights.contestados.quantidade > 0
          ? `${insights.contestados.quantidade} ocorrência${insights.contestados.quantidade === 1 ? '' : 's'}`
          : 'Nenhuma contestação',
      valor:
        insights.contestados.quantidade > 0
          ? formatarMoeda(insights.contestados.valorTotal)
          : undefined,
      detalhe:
        insights.contestados.quantidade > 0
          ? 'Requer análise'
          : 'Tudo regularizado',
      icon: insights.contestados.quantidade > 0 ? AlertTriangle : Receipt,
      accent: insights.contestados.quantidade > 0 ? 'destructive' : 'tertiary',
    },
  ];

  return (
    <section className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold text-foreground">Insights</h2>
        <p className="text-[10px] text-muted-foreground">
          Com base nos filtros aplicados
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <InsightCard key={card.titulo} {...card} />
        ))}
      </div>
    </section>
  );
}
