'use client';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  DollarSign,
  Loader2,
  MapPin,
  Save,
  Scale,
  TrendingUp,
  Truck,
} from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import { CustoAdicionalForm } from '@/features/transporte/components/custo-adicional-form';
import { StatusCustoBadge } from '@/features/transporte/components/status-custo-badge';
import { useCustoFreteDetalhe } from '@/features/transporte/hooks/use-custo-frete-detalhe';
import { formatarMoeda } from '@/features/transporte/lib/calcular-custo';
import { calcularCustoPorTon } from '@/features/transporte/lib/calcular-custo-frete';

const NIVEL_VARIACAO_BORDER = {
  dentro: 'border-tertiary/20',
  atencao: 'border-secondary/20',
  acima: 'border-destructive/20',
} as const;

const inputClass = cn(
  'w-full rounded-md border border-outline-variant bg-surface-low px-2.5 py-1.5',
  'text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
);

const kpiCardClass = cn(
  'relative overflow-hidden rounded-lg border border-outline-variant',
  'bg-glass-bg px-3 py-2 shadow-inner-glow backdrop-blur-glass',
);

type KpiCardProps = {
  label: string;
  value: string;
  subValue?: string;
  icon: typeof DollarSign;
  accent?: 'default' | 'tertiary' | 'destructive' | 'secondary' | 'primary';
  borderAccent?: keyof typeof NIVEL_VARIACAO_BORDER;
};

function KpiCard({
  label,
  value,
  subValue,
  icon: Icon,
  accent = 'default',
  borderAccent,
}: KpiCardProps) {
  const valueColor = {
    default: 'text-foreground',
    tertiary: 'text-tertiary',
    destructive: 'text-destructive',
    secondary: 'text-secondary',
    primary: 'text-primary',
  }[accent];

  const iconColor = {
    default: 'text-primary',
    tertiary: 'text-tertiary',
    destructive: 'text-destructive',
    secondary: 'text-secondary',
    primary: 'text-primary',
  }[accent];

  return (
    <div
      className={cn(
        kpiCardClass,
        borderAccent && NIVEL_VARIACAO_BORDER[borderAccent],
      )}
    >
      <Icon
        className={cn(
          'pointer-events-none absolute -right-1 -top-1 size-7 opacity-[0.08]',
          iconColor,
        )}
        aria-hidden
      />
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn('mt-0.5 font-mono text-sm font-bold leading-tight', valueColor)}>
        {value}
      </p>
      {subValue ? (
        <p className="mt-0.5 text-[10px] text-muted-foreground">{subValue}</p>
      ) : null}
    </div>
  );
}

function MetaChip({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-surface-low/80 px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-outline-variant">
      <Icon className="size-3 shrink-0" aria-hidden />
      {children}
    </span>
  );
}

type CustoFreteDetalheViewProps = {
  custoFreteId: string;
};

export function CustoFreteDetalheView({ custoFreteId }: CustoFreteDetalheViewProps) {
  const {
    item,
    transporte,
    custoPrevistoDetalhado,
    custoPrevisto,
    custoDiariaPago,
    setCustoDiariaPago,
    custosAdicionais,
    totalAdicionais,
    totalPago,
    variacao,
    status,
    observacoes,
    setObservacoes,
    salvando,
    adicionarCustoAdicional,
    removerCustoAdicional,
    atualizarCustoAdicional,
    salvar,
  } = useCustoFreteDetalhe(custoFreteId);

  if (!item || !transporte) {
    return (
      <SidebarMain>
        <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
          <div className="mx-auto max-w-container space-y-4">
            <p className="text-body-md text-muted-foreground">
              Custo de frete não encontrado.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/transporte/custos-frete">Voltar para Gestão de Frete</Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  const variacaoPositiva = variacao.valor >= 0;
  const transportadora = transporte.veiculoAlocado?.transportadora ?? 'Não alocado';
  const placa = transporte.veiculoAlocado?.placa ?? '—';

  const variacaoFormatada = `${variacaoPositiva ? '+' : ''}${formatarMoeda(variacao.valor)}`;
  const percentualFormatado = `${variacaoPositiva ? '+' : ''}${variacao.percentual.toFixed(1)}%`;
  const variacaoAccent =
    variacao.nivel === 'acima'
      ? 'destructive'
      : variacao.nivel === 'atencao'
        ? 'secondary'
        : 'tertiary';
  const custoPorTon =
    totalPago > 0
      ? calcularCustoPorTon(totalPago, transporte.pesoTotal)
      : 0;
  const pesoTon = transporte.pesoTotal / 1000;

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-4 md:px-margin-desktop md:py-5">
        <div className="mx-auto max-w-container space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Link
                href="/transporte/custos-frete"
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <ArrowLeft className="size-3" aria-hidden />
                Gestão de Frete
              </Link>
              <ChevronRight className="size-3" aria-hidden />
              <span className="text-foreground">{transporte.rota}</span>
            </nav>
            <Button
              onClick={salvar}
              disabled={salvando}
              size="sm"
              className="gap-1.5"
            >
              {salvando ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Save className="size-3.5" aria-hidden />
              )}
              Salvar
            </Button>
          </div>

          <header className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-primary md:text-2xl">
                {transporte.rota}
              </h1>
              <StatusCustoBadge status={status} />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <MetaChip icon={MapPin}>
                {transporte.cidade} · {transporte.bairro}
              </MetaChip>
              <MetaChip icon={Truck}>
                {transportadora} · {placa}
              </MetaChip>
              <MetaChip icon={Calendar}>{transporte.dataTransporte}</MetaChip>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
            <KpiCard
              label="Previsto"
              value={formatarMoeda(custoPrevisto)}
              subValue={
                custoPrevistoDetalhado
                  ? `${formatarMoeda(custoPrevistoDetalhado.custoDiaria)}/dia`
                  : undefined
              }
              icon={DollarSign}
            />
            <KpiCard
              label="Pago"
              value={formatarMoeda(totalPago)}
              subValue={
                totalAdicionais > 0
                  ? `+ ${formatarMoeda(totalAdicionais)} adicionais`
                  : undefined
              }
              icon={DollarSign}
              accent="tertiary"
            />
            <KpiCard
              label="Variação"
              value={variacaoFormatada}
              subValue={percentualFormatado}
              icon={TrendingUp}
              accent={variacaoAccent}
              borderAccent={variacao.nivel}
            />
            <KpiCard
              label="R$/Ton"
              value={custoPorTon > 0 ? formatarMoeda(custoPorTon) : '—'}
              subValue={
                transporte.pesoTotal > 0
                  ? `${pesoTon.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} t · ${transporte.pesoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg`
                  : 'Sem peso'
              }
              icon={Scale}
              accent="primary"
            />
            <div className={cn(kpiCardClass, 'col-span-2 lg:col-span-1')}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Composição prevista
              </p>
              {custoPrevistoDetalhado ? (
                <dl className="mt-1 space-y-0.5 text-[11px]">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Diária</dt>
                    <dd className="font-mono font-medium text-foreground">
                      {formatarMoeda(custoPrevistoDetalhado.custoDiaria)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Total diária</dt>
                    <dd className="font-mono font-medium text-foreground">
                      {formatarMoeda(custoPrevistoDetalhado.total)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Não calculado
                </p>
              )}
            </div>
          </div>

          <section className="space-y-3 rounded-xl border border-outline-variant bg-surface-low/30 p-3 md:p-4">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-outline-variant pb-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Custo Realizado</h2>
                <p className="text-[11px] text-muted-foreground">
                  Lance a diária paga e custos adicionais
                </p>
              </div>
              <div className="flex items-end gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="custo-diaria-pago"
                    className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Diária paga
                  </label>
                  <input
                    id="custo-diaria-pago"
                    type="number"
                    min={0}
                    step={0.01}
                    className={cn(inputClass, 'w-32 font-mono')}
                    value={custoDiariaPago || ''}
                    onChange={(event) =>
                      setCustoDiariaPago(Number.parseFloat(event.target.value) || 0)
                    }
                    disabled={salvando}
                  />
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Total pago
                  </p>
                  <p className="font-mono text-base font-bold text-tertiary">
                    {formatarMoeda(totalPago)}
                  </p>
                </div>
              </div>
            </div>

            <CustoAdicionalForm
              itens={custosAdicionais}
              onAdicionar={adicionarCustoAdicional}
              onRemover={removerCustoAdicional}
              onAtualizar={atualizarCustoAdicional}
              disabled={salvando}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-outline-variant bg-glass-bg px-3 py-2 sm:hidden">
              <div>
                <p className="text-[10px] text-muted-foreground">Adicionais</p>
                <p className="font-mono text-xs font-semibold">
                  {formatarMoeda(totalAdicionais)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Total pago</p>
                <p className="font-mono text-sm font-bold text-tertiary">
                  {formatarMoeda(totalPago)}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="observacoes"
                className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Observações
              </label>
              <textarea
                id="observacoes"
                rows={2}
                className={inputClass}
                placeholder="Justificativas, contestações ou notas..."
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                disabled={salvando}
              />
            </div>
          </section>
        </div>
      </main>
    </SidebarMain>
  );
}
