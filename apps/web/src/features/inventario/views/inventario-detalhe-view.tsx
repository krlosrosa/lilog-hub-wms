'use client';

import { toast } from 'sonner';

import Link from 'next/link';

import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  Pause,
  Plus,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { accentSubtleBadgePlainClassName } from '@/lib/semantic-badge-classes';
import { SidebarMain } from '@/components/layout/sidebar';

import { DivergenciaRow } from '@/features/inventario/components/divergencia-row';
import { premiumCardClassName } from '@/features/inventario/components/form-field-classes';
import { SetorProgressItem } from '@/features/inventario/components/setor-progress-item';
import { TeamMemberItem } from '@/features/inventario/components/team-member-item';
import { useInventarioDetalhe } from '@/features/inventario/hooks/use-inventario-detalhe';

const glassCard = cn(
  premiumCardClassName,
  'border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass',
);

export type InventarioDetalheViewProps = {
  inventarioId: string;
};

export function InventarioDetalheView({
  inventarioId,
}: InventarioDetalheViewProps) {
  const {
    header,
    metricas,
    setores,
    membros,
    divergencias,
    eficienciaTimePercent,
    pausar,
    finalizar,
    pausando,
    finalizando,
    verTodasDivergencias,
    exportarCsv,
  } = useInventarioDetalhe(inventarioId);

  const r = 32;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - metricas.progressoPercent / 100);

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-5 md:space-y-6 lg:space-y-8">
        <Link
          href="/inventario"
          className="inline-flex items-center gap-2 text-caption text-muted-foreground transition-colors hover:text-primary md:text-label-md"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar à visão geral
        </Link>

        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-primary md:text-headline-lg">
              Overview em tempo real —{' '}
              <span className="text-foreground/90">{header.codigo}</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  'flex items-center gap-1.5 rounded-full border border-accent/40 px-2.5 py-0.5 text-caption font-semibold',
                  accentSubtleBadgePlainClassName,
                )}
              >
                <span className="size-2 animate-pulse rounded-full bg-accent" />
                {header.statusLabel}
              </span>
              <span className="text-caption text-muted-foreground">
                {header.tempoDecorridoLabel}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild type="button" size="sm" className="gap-2">
              <Link href={`/inventario/${inventarioId}/demandas/nova`}>
                <Plus className="size-4 shrink-0" aria-hidden />
                Adicionar demanda
              </Link>
            </Button>
            <Button
              disabled={pausando}
              variant="outline"
              type="button"
              size="sm"
              onClick={() => void pausar()}
            >
              <Pause aria-hidden />
              Pausar inventário
            </Button>
            <Button
              disabled={finalizando}
              type="button"
              size="sm"
              className="gap-2"
              onClick={() => void finalizar()}
            >
              <BadgeCheck aria-hidden className="size-4" />
              Finalizar
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3 md:gap-5">
          <div className={cn(glassCard, 'relative overflow-hidden p-5 md:p-6')}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-caption text-muted-foreground">Progresso total</p>
                <p className="text-headline-md font-bold text-primary">
                  {metricas.progressoPercent}
                  <span className="text-sm font-semibold">%</span>
                </p>
                <p className="mt-1 text-caption text-muted-foreground">
                  {metricas.itensContados.toLocaleString('pt-BR')} de{' '}
                  {metricas.itensTotal.toLocaleString('pt-BR')} itens contados
                </p>
              </div>
              <div className="relative size-20 shrink-0 md:size-24">
                <svg
                  className="-rotate-90 size-full text-muted"
                  viewBox="0 0 96 96"
                  aria-hidden
                >
                  <circle
                    cx={48}
                    cy={48}
                    r={r}
                    stroke="currentColor"
                    strokeWidth={6}
                    fill="transparent"
                  />
                  <circle
                    className="text-primary"
                    cx={48}
                    cy={48}
                    r={r}
                    stroke="currentColor"
                    strokeWidth={6}
                    fill="transparent"
                    strokeDasharray={circ}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <TrendingUp className="size-5 text-primary/50 md:size-6" aria-hidden />
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className={cn(glassCard, 'flex flex-col justify-between gap-3 p-5 md:p-6')}>
            <div className="flex justify-between gap-3">
              <p className="text-caption text-muted-foreground">
                Acurácia atual
              </p>
              <BadgeCheck className="size-7 shrink-0 rounded-lg bg-accent/15 p-1.5 text-accent md:size-8" aria-hidden />
            </div>
            <p className="text-headline-md font-bold text-accent">
              {metricas.acuraciaPercent}
              <span className="text-sm font-semibold">%</span>
            </p>
            <div>
              <div className="mb-2 flex justify-between text-caption text-muted-foreground">
                <span>Performance meta</span>
                <span className="font-bold text-accent">{metricas.metaDeltaLabel}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${String(metricas.acuraciaPercent)}%` }}
                />
              </div>
            </div>
          </div>

          <div className={cn(glassCard, 'border-destructive/35 border-l-4 p-5 md:p-6')}>
            <div className="flex justify-between gap-2">
              <p className="text-caption text-muted-foreground">
                Divergências
              </p>
              <TriangleAlert className="size-7 shrink-0 rounded-lg bg-destructive/15 p-1.5 text-destructive md:size-8" aria-hidden />
            </div>
            <p className="mt-1 text-headline-md font-bold text-destructive">
              {metricas.divergenciasCount}{' '}
              <span className="text-sm font-semibold text-destructive/90">itens</span>
            </p>
            <p className="mt-2 text-caption text-muted-foreground">
              Impacto financeiro est.:{' '}
              <span className="font-medium text-destructive">
                {metricas.impactoFinanceiroLabel}
              </span>
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <article className={cn(glassCard, 'flex flex-col overflow-hidden lg:col-span-2')}>
            <div className="flex items-center justify-between border-b border-outline-variant px-4 py-4 md:px-6">
              <h2 className="text-headline-md font-bold uppercase tracking-wide text-foreground">
                Status por setor
              </h2>
              <Button type="button" variant="link" size="sm" className="text-xs font-bold">
                Ver mapa completo
              </Button>
            </div>
            <div className="flex flex-col gap-4 px-4 py-4 md:gap-5 md:px-6 md:py-6">
              {setores.map((s) => (
                <SetorProgressItem key={s.id} setor={s} />
              ))}
            </div>
          </article>

          <article className={cn(glassCard, 'flex flex-col overflow-hidden')}>
            <div className="border-b border-outline-variant px-4 py-4 md:px-6">
              <h2 className="text-headline-md font-bold uppercase tracking-wide text-foreground">
                Produtividade da equipe
              </h2>
            </div>
            <div className="flex flex-col gap-0.5 px-2 py-3 md:px-3 md:py-4">
              {membros.map((m) => (
                <TeamMemberItem key={m.id} membro={m} />
              ))}
            </div>
            <div className="mt-auto bg-muted/35 p-4">
              <div className="mb-2 flex justify-between text-caption text-muted-foreground">
                <span>Eficiência de time</span>
                <span className="font-bold text-primary">{eficienciaTimePercent}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${String(eficienciaTimePercent)}%` }}
                />
              </div>
            </div>
          </article>
        </section>

        <article className={cn(glassCard, 'overflow-hidden')}>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant px-4 py-4 md:px-6">
            <h2 className="text-headline-md font-bold uppercase tracking-wide text-foreground">
              Últimas divergências identificadas
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.info('Filtro por setor (mock)');
                }}
              >
                Filtrar por setor
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={exportarCsv}>
                Exportar CSV
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-outline-variant bg-surface-high/50">
                <tr>
                  {[
                    'SKU / produto',
                    'Setor',
                    'Esperado',
                    'Encontrado',
                    'Diferença',
                    'Tipo',
                    'Ação',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-label-md md:font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {divergencias.map((dv) => (
                  <DivergenciaRow key={dv.id} item={dv} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center border-t border-outline-variant p-4">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="gap-1"
              onClick={verTodasDivergencias}
            >
              Ver todas as {metricas.divergenciasCount} divergências
              <ChevronDown className="size-4" aria-hidden />
            </Button>
          </div>
        </article>
      </div>
      </main>
    </SidebarMain>
  );
}
