'use client';

import { cn } from '@lilog/ui';
import { BarChart3, PieChart } from 'lucide-react';

import { formatarMoeda } from '@/features/transporte/lib/calcular-custo';
import type {
  CustoFreteGraficoRota,
  CustoFreteGraficoStatus,
  CustoFreteIndicadores,
  RankingTipoAdicional,
  RankingTransportadoraCusto,
  StatusCustoFrete,
} from '@/features/transporte/types/transporte.schema';
import { STATUS_CUSTO_FRETE_LABELS } from '@/features/transporte/types/transporte.schema';

const chartPanelClass = cn(
  'relative overflow-hidden rounded-xl border border-outline-variant',
  'bg-glass-bg shadow-inner-glow backdrop-blur-glass',
);

const STATUS_COLORS: Record<StatusCustoFrete, string> = {
  pago: 'bg-tertiary',
  pendente: 'bg-muted-foreground/40',
  contestado: 'bg-destructive',
};

const STATUS_TEXT: Record<StatusCustoFrete, string> = {
  pago: 'text-tertiary',
  pendente: 'text-muted-foreground',
  contestado: 'text-destructive',
};

const ADICIONAL_COLORS = [
  'bg-primary',
  'bg-secondary',
  'bg-tertiary',
  'bg-destructive/70',
  'bg-primary/50',
  'bg-secondary/60',
] as const;

type ChartPanelProps = {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
  className?: string;
  icon?: typeof BarChart3;
};

function ChartPanel({
  titulo,
  descricao,
  children,
  className,
  icon: Icon = BarChart3,
}: ChartPanelProps) {
  return (
    <section className={cn(chartPanelClass, 'p-4 md:p-5', className)}>
      <div className="relative z-10">
        <h3 className="text-sm font-semibold text-foreground">{titulo}</h3>
        {descricao ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{descricao}</p>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
      <div className="pointer-events-none absolute -bottom-4 -right-4 opacity-[0.04]">
        <Icon className="size-24 text-foreground" aria-hidden />
      </div>
    </section>
  );
}

function ChartEmpty({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-outline-variant bg-surface-low/30">
      <p className="text-xs text-muted-foreground">{mensagem}</p>
    </div>
  );
}

function formatarCompacto(valor: number): string {
  if (valor >= 1000) {
    return `R$ ${(valor / 1000).toFixed(1)}k`;
  }

  return formatarMoeda(valor);
}

type PrevistoVsPagoChartProps = {
  dados: CustoFreteGraficoRota[];
};

export function PrevistoVsPagoChart({ dados }: PrevistoVsPagoChartProps) {
  if (dados.length === 0) {
    return (
      <ChartPanel
        titulo="Previsto vs Pago por Rota"
        descricao="Comparativo de custo estimado e valor realmente pago"
      >
        <ChartEmpty mensagem="Sem dados para exibir" />
      </ChartPanel>
    );
  }

  const maxValor = Math.max(
    ...dados.flatMap((item) => [item.previsto, item.pago]),
    1,
  );

  return (
    <ChartPanel
      titulo="Previsto vs Pago por Rota"
      descricao="Comparativo de custo estimado e valor realmente pago"
    >
      <div className="mb-3 flex flex-wrap gap-4 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary/30" aria-hidden />
          Previsto
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary" aria-hidden />
          Pago
        </span>
      </div>
      <div className="flex h-52 items-end justify-between gap-2">
        {dados.map((item) => {
          const alturaPrevisto = (item.previsto / maxValor) * 100;
          const alturaPago = (item.pago / maxValor) * 100;

          return (
            <div
              key={item.rota}
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
            >
              <div className="flex h-full w-full items-end justify-center gap-0.5">
                <div
                  className="relative w-3 max-w-full rounded-t-sm bg-primary/25 transition-all group-hover:bg-primary/40 sm:w-4"
                  style={{ height: `${Math.max(alturaPrevisto, 4)}%` }}
                  title={`Previsto: ${formatarMoeda(item.previsto)}`}
                >
                  <span className="pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-1.5 py-0.5 text-[9px] text-popover-foreground shadow-sm group-hover:block">
                    {formatarCompacto(item.previsto)}
                  </span>
                </div>
                <div
                  className="relative w-3 max-w-full rounded-t-sm bg-primary transition-all group-hover:bg-primary/80 sm:w-4"
                  style={{ height: `${Math.max(alturaPago, 4)}%` }}
                  title={`Pago: ${formatarMoeda(item.pago)}`}
                >
                  <span className="pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-1.5 py-0.5 text-[9px] text-popover-foreground shadow-sm group-hover:block">
                    {formatarCompacto(item.pago)}
                  </span>
                </div>
              </div>
              <span className="w-full truncate text-center text-[9px] text-muted-foreground">
                {item.rota.replace('-SP', '')}
              </span>
            </div>
          );
        })}
      </div>
    </ChartPanel>
  );
}

type TransportadoraChartProps = {
  dados: RankingTransportadoraCusto[];
};

export function TransportadoraDistribuicaoChart({
  dados,
}: TransportadoraChartProps) {
  if (dados.length === 0) {
    return (
      <ChartPanel
        titulo="Distribuição por Transportadora"
        descricao="Participação no total pago"
      >
        <ChartEmpty mensagem="Sem dados para exibir" />
      </ChartPanel>
    );
  }

  const maxPago = Math.max(...dados.map((item) => item.totalPago), 1);

  return (
    <ChartPanel
      titulo="Distribuição por Transportadora"
      descricao="Participação no total pago"
    >
      <div className="space-y-3">
        {dados.map((item, index) => (
          <div key={item.transportadora} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="truncate font-medium text-foreground">
                {item.transportadora}
              </span>
              <span className="shrink-0 font-mono text-muted-foreground">
                {formatarMoeda(item.totalPago)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-low">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  index === 0 ? 'bg-primary' : 'bg-primary/50',
                )}
                style={{
                  width: `${(item.totalPago / maxPago) * 100}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {item.transportes} transporte{item.transportes === 1 ? '' : 's'} ·{' '}
              {item.percentualTotal.toFixed(1)}% do total
            </p>
          </div>
        ))}
      </div>
    </ChartPanel>
  );
}

type OcupacaoRotaChartProps = {
  dados: CustoFreteIndicadores['rankingOcupacaoPorRota'];
};

function corOcupacao(valor: number): string {
  if (valor >= 70) {
    return 'bg-tertiary';
  }

  if (valor >= 40) {
    return 'bg-secondary';
  }

  return 'bg-destructive/70';
}

export function OcupacaoRotaChart({ dados }: OcupacaoRotaChartProps) {
  if (dados.length === 0) {
    return (
      <ChartPanel
        titulo="Ocupação por Rota"
        descricao="Aproveitamento da capacidade do veículo"
      >
        <ChartEmpty mensagem="Sem dados para exibir" />
      </ChartPanel>
    );
  }

  return (
    <ChartPanel
      titulo="Ocupação por Rota"
      descricao="Aproveitamento da capacidade do veículo"
    >
      <div className="mb-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-tertiary" aria-hidden />
          ≥ 70%
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-secondary" aria-hidden />
          40–69%
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-destructive/70" aria-hidden />
          &lt; 40%
        </span>
      </div>
      <div className="space-y-2.5">
        {dados.map((item) => (
          <div key={item.rota} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-medium text-foreground">{item.rota}</span>
              <span className="font-mono text-muted-foreground">
                {item.ocupacao.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-low">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  corOcupacao(item.ocupacao),
                )}
                style={{ width: `${Math.min(item.ocupacao, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartPanel>
  );
}

type AdicionaisChartProps = {
  dados: RankingTipoAdicional[];
};

export function AdicionaisTipoChart({ dados }: AdicionaisChartProps) {
  if (dados.length === 0) {
    return (
      <ChartPanel
        titulo="Custos Adicionais por Tipo"
        descricao="Distribuição de valores extras lançados"
        icon={PieChart}
      >
        <ChartEmpty mensagem="Nenhum custo adicional lançado" />
      </ChartPanel>
    );
  }

  const total = dados.reduce((acc, item) => acc + item.valorTotal, 0);
  let acumulado = 0;

  const segmentos = dados.map((item, index) => {
    const percentual = (item.valorTotal / total) * 100;
    const inicio = acumulado;
    acumulado += percentual;

    return {
      ...item,
      percentual,
      inicio,
      cor: ADICIONAL_COLORS[index % ADICIONAL_COLORS.length],
    };
  });

  const CORES_HEX = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--tertiary))',
    'hsl(var(--destructive) / 0.7)',
    'hsl(var(--primary) / 0.5)',
    'hsl(var(--secondary) / 0.6)',
  ];

  let acum = 0;
  const gradientStops = segmentos.map((seg, index) => {
    const pct = (seg.valorTotal / total) * 100;
    const start = acum;
    acum += pct;
    return `${CORES_HEX[index % CORES_HEX.length]} ${start}% ${acum}%`;
  });

  return (
    <ChartPanel
      titulo="Custos Adicionais por Tipo"
      descricao="Distribuição de valores extras lançados"
      icon={PieChart}
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div
          className="relative size-36 shrink-0 rounded-full"
          style={{
            background: `conic-gradient(${gradientStops.join(', ')})`,
          }}
        >
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-glass-bg text-center">
            <span className="text-[10px] text-muted-foreground">Total</span>
            <span className="font-mono text-xs font-bold text-foreground">
              {formatarCompacto(total)}
            </span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {segmentos.map((item, index) => (
            <li
              key={item.tipo}
              className="flex items-center justify-between gap-2 text-[11px]"
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <span
                  className={cn('size-2.5 shrink-0 rounded-sm', item.cor)}
                  aria-hidden
                />
                <span className="truncate text-foreground">{item.label}</span>
              </span>
              <span className="shrink-0 font-mono text-muted-foreground">
                {item.percentual.toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartPanel>
  );
}

type StatusDistribuicaoChartProps = {
  dados: CustoFreteGraficoStatus[];
  total: number;
};

export function StatusDistribuicaoChart({
  dados,
  total,
}: StatusDistribuicaoChartProps) {
  if (dados.length === 0 || total === 0) {
    return (
      <ChartPanel
        titulo="Status dos Lançamentos"
        descricao="Distribuição por situação de pagamento"
      >
        <ChartEmpty mensagem="Sem lançamentos" />
      </ChartPanel>
    );
  }

  return (
    <ChartPanel
      titulo="Status dos Lançamentos"
      descricao="Distribuição por situação de pagamento"
    >
      <div className="mb-4 flex h-3 overflow-hidden rounded-full">
        {dados.map((item) => (
          <div
            key={item.status}
            className={cn('transition-all', STATUS_COLORS[item.status])}
            style={{ width: `${(item.quantidade / total) * 100}%` }}
            title={`${STATUS_CUSTO_FRETE_LABELS[item.status]}: ${item.quantidade}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {dados.map((item) => (
          <div
            key={item.status}
            className="rounded-lg border border-outline-variant bg-surface-low/40 px-3 py-2 text-center"
          >
            <p
              className={cn(
                'font-mono text-lg font-bold',
                STATUS_TEXT[item.status],
              )}
            >
              {item.quantidade}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {STATUS_CUSTO_FRETE_LABELS[item.status]}
            </p>
          </div>
        ))}
      </div>
    </ChartPanel>
  );
}

type DropsizeChartProps = {
  dados: CustoFreteIndicadores['rankingDropsizePorRota'];
};

export function DropsizeRotaChart({ dados }: DropsizeChartProps) {
  if (dados.length === 0) {
    return (
      <ChartPanel
        titulo="Dropsize por Rota"
        descricao="Peso médio por entrega (cliente)"
      >
        <ChartEmpty mensagem="Sem dados para exibir" />
      </ChartPanel>
    );
  }

  const maxDropsize = Math.max(...dados.map((item) => item.dropsize), 1);

  return (
    <ChartPanel
      titulo="Dropsize por Rota"
      descricao="Peso médio por entrega (cliente)"
    >
      <div className="flex h-44 items-end justify-between gap-2">
        {dados.map((item) => {
          const altura = (item.dropsize / maxDropsize) * 100;

          return (
            <div
              key={item.rota}
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
            >
              <div
                className="relative w-full max-w-[40px] rounded-t-md bg-secondary/60 transition-colors group-hover:bg-secondary"
                style={{ height: `${Math.max(altura, 8)}%` }}
                title={`${item.dropsize.toFixed(1)} kg · ${item.entregas} cliente${item.entregas === 1 ? '' : 's'}`}
              >
                <span className="pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-1.5 py-0.5 text-[9px] text-popover-foreground shadow-sm group-hover:block">
                  {item.dropsize.toFixed(0)} kg
                </span>
              </div>
              <span className="w-full truncate text-center text-[9px] text-muted-foreground">
                {item.rota.replace('-SP', '')}
              </span>
            </div>
          );
        })}
      </div>
    </ChartPanel>
  );
}
