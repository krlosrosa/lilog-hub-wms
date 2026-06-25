'use client';

import Link from 'next/link';

import { cn } from '@lilog/ui';
import { ArrowDown, ArrowUp, Clock, TrendingUp, Wrench } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import { ManutencaoOsTable } from '@/features/equipamento/components/manutencao-os-table';
import { useEquipamentoManutencao } from '@/features/equipamento/hooks/use-equipamento-manutencao';
import type { CustoSemana } from '@/features/equipamento/types/equipamento.schema';

function KpiCard({
  label,
  value,
  unit,
  delta,
  deltaPositive,
}: {
  label: string;
  value: string;
  unit: string;
  delta: number;
  deltaPositive: boolean;
}) {
  const isUp = delta >= 0;
  const DeltaIcon = isUp ? ArrowUp : ArrowDown;

  return (
    <div className="rounded-xl border border-outline-variant bg-glass-bg p-6 backdrop-blur-glass shadow-inner-glow">
      <p className="text-caption font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-headline-lg font-bold text-primary">{value}</span>
        <span className="text-body-md text-muted-foreground">{unit}</span>
      </div>
      <p
        className={cn(
          'mt-2 flex items-center gap-1 text-caption font-medium',
          (deltaPositive && isUp) || (!deltaPositive && !isUp)
            ? 'text-status-active'
            : 'text-destructive',
        )}
      >
        <DeltaIcon className="size-3.5" aria-hidden />
        {Math.abs(delta)}% vs. período anterior
      </p>
    </div>
  );
}

function CustosChart({ semanas }: { semanas: CustoSemana[] }) {
  const maxTotal = Math.max(
    ...semanas.map((s) => s.pecas + s.maoObra + s.terceiros),
    1,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 text-caption">
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-primary" aria-hidden />
          Peças
        </span>
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-secondary" aria-hidden />
          Mão de obra
        </span>
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-tertiary" aria-hidden />
          Terceiros
        </span>
      </div>
      <div className="flex h-48 items-end justify-between gap-4">
        {semanas.map((sem) => {
          const total = sem.pecas + sem.maoObra + sem.terceiros;
          const heightPct = (total / maxTotal) * 100;
          const pecasPct = (sem.pecas / total) * 100;
          const maoPct = (sem.maoObra / total) * 100;
          const terPct = (sem.terceiros / total) * 100;

          return (
            <div
              key={sem.semana}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div
                className="flex w-full max-w-[48px] flex-col justify-end overflow-hidden rounded-t-md border border-outline-variant/50"
                style={{ height: `${heightPct}%`, minHeight: '24px' }}
              >
                <div
                  className="bg-tertiary"
                  style={{ height: `${terPct}%` }}
                />
                <div
                  className="bg-secondary"
                  style={{ height: `${maoPct}%` }}
                />
                <div
                  className="bg-primary"
                  style={{ height: `${pecasPct}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {sem.semana}
              </span>
              <span className="font-mono text-[10px] font-semibold text-foreground">
                R$ {(total / 1000).toFixed(1)}k
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EquipamentoManutencaoView() {
  const {
    kpis,
    ordensServico,
    preventivas,
    custosSemana,
    processandoOsId,
    assumirOs,
    verDetalhesOs,
  } = useEquipamentoManutencao();

  const totalCustos = custosSemana.reduce(
    (acc, s) => acc + s.pecas + s.maoObra + s.terceiros,
    0,
  );

  return (
    <SidebarMain className="blueprint-grid">
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-2">
              <Wrench className="size-5 text-primary" aria-hidden />
              <span className="text-caption font-bold uppercase tracking-widest text-primary">
                Manutenção
              </span>
            </div>
            <h1 className="text-headline-lg font-semibold tracking-tight text-foreground">
              Centro de manutenção de equipamentos
            </h1>
            <p className="mt-1 max-w-2xl text-body-md text-muted-foreground">
              Fila de ordens de serviço, preventivas por horímetro e distribuição
              de custos.
            </p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiCard
              label="MTBF"
              value={String(kpis.mtbfHoras)}
              unit="horas"
              delta={kpis.mtbfDeltaPercent}
              deltaPositive
            />
            <KpiCard
              label="MTTR"
              value={String(kpis.mttrHoras)}
              unit="horas"
              delta={kpis.mttrDeltaPercent}
              deltaPositive={false}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section className="lg:col-span-8">
              <div className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
                <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
                  <div>
                    <h2 className="text-title-md font-semibold text-foreground">
                      Fila de ordens de serviço
                    </h2>
                    <p className="text-caption text-muted-foreground">
                      {ordensServico.length} OS em aberto
                    </p>
                  </div>
                  <Link
                    href="/equipamento"
                    className="text-caption font-medium text-primary hover:underline"
                  >
                    Ver diretório
                  </Link>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <ManutencaoOsTable
                    ordens={ordensServico}
                    processandoOsId={processandoOsId}
                    onAssumir={assumirOs}
                    onDetalhes={verDetalhesOs}
                  />
                </div>
              </div>
            </section>

            <section className="lg:col-span-4">
              <div className="rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
                <h2 className="mb-4 flex items-center gap-2 text-title-md font-semibold text-foreground">
                  <Clock className="size-5 text-primary" aria-hidden />
                  Manutenção preventiva
                </h2>
                <div className="space-y-4">
                  {preventivas.map((prev) => (
                    <div
                      key={prev.id}
                      className="rounded-lg border border-outline-variant bg-surface-low/30 p-4"
                    >
                      <p className="text-label-md font-medium text-foreground">
                        {prev.titulo}
                      </p>
                      <p className="mt-1 font-mono text-caption text-muted-foreground">
                        {prev.horimetroAtual.toLocaleString('pt-BR')} /{' '}
                        {prev.horimetroLimite.toLocaleString('pt-BR')} h
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${prev.percentual}%` }}
                        />
                      </div>
                      <p className="mt-1 text-right font-mono text-[10px] text-primary">
                        {prev.percentual}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="lg:col-span-12">
              <div className="rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-title-md font-semibold text-foreground">
                      <TrendingUp className="size-5 text-primary" aria-hidden />
                      Distribuição de custos
                    </h2>
                    <p className="text-caption text-muted-foreground">
                      Total do período: R{' '}
                      {totalCustos.toLocaleString('pt-BR', {
                        minimumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>
                <CustosChart semanas={custosSemana} />
              </div>
            </section>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
