'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import Link from 'next/link';

import {
  ArrowLeft,
  BadgeCheck,
  ClipboardList,
  Download,
  Loader2,
  Pause,
  Plus,
  TriangleAlert,
  TrendingUp,
} from 'lucide-react';

import { toast } from 'sonner';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';

import { DivergenciaRow } from '@/features/inventario/components/divergencia-row';
import { ModalReprovarDivergencia } from '@/features/inventario/components/modal-reprovar-divergencia';
import { ModalSolicitarRecontagemDivergencia } from '@/features/inventario/components/modal-solicitar-recontagem-divergencia';
import { DemandaProgressItem } from '@/features/inventario/components/demanda-progress-item';
import { useInventarioDetalhe } from '@/features/inventario/hooks/use-inventario-detalhe';
import type { DivergenciaFiltroStatus } from '@/features/inventario/types/inventario-detalhe.schema';
import type { DivergenciaItem } from '@/features/inventario/types/inventario-detalhe.schema';

const glassCard =
  'overflow-hidden rounded-lg border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass';

const DIVERGENCIA_HEADERS = [
  { label: 'SKU / produto', className: 'min-w-[8rem]' },
  { label: 'Setor', className: 'hidden sm:table-cell' },
  { label: 'Esperado', className: 'w-16' },
  { label: 'Encontrado', className: 'w-16' },
  { label: 'Dif.', className: 'w-14' },
  { label: 'Tipo / status', className: 'hidden md:table-cell w-24' },
  { label: 'Ações', className: 'w-36 text-right' },
] as const;

const FILTROS_DIVERGENCIA: Array<{
  id: DivergenciaFiltroStatus;
  label: string;
}> = [
  { id: 'pendente', label: 'Pendentes' },
  { id: 'aprovada', label: 'Aprovadas' },
  { id: 'aplicada', label: 'Aplicadas' },
  { id: 'reprovada', label: 'Reprovadas' },
  { id: 'todas', label: 'Todas' },
];

export type InventarioDetalheViewProps = {
  inventarioId: string;
};

function MiniRingProgress({ percent }: { percent: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - percent / 100);

  return (
    <div className="relative size-10 shrink-0">
      <svg
        className="size-full -rotate-90 text-muted"
        viewBox="0 0 36 36"
        aria-hidden
      >
        <circle
          cx={18}
          cy={18}
          r={r}
          stroke="currentColor"
          strokeWidth={3}
          fill="transparent"
        />
        <circle
          className="text-primary"
          cx={18}
          cy={18}
          r={r}
          stroke="currentColor"
          strokeWidth={3}
          fill="transparent"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <TrendingUp className="size-3 text-primary/60" aria-hidden />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  detail,
  tone = 'default',
  icon,
  progress,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  detail?: string;
  tone?: 'default' | 'accent' | 'destructive';
  icon?: ReactNode;
  progress?: number;
}) {
  const valueTone =
    tone === 'accent'
      ? 'text-accent'
      : tone === 'destructive'
        ? 'text-destructive'
        : 'text-foreground';

  const progressTone =
    tone === 'accent'
      ? 'bg-accent'
      : tone === 'destructive'
        ? 'bg-destructive'
        : 'bg-primary';

  return (
    <div
      className={cn(
        glassCard,
        'flex min-w-[9.5rem] shrink-0 snap-start flex-col gap-1 p-3 sm:min-w-0',
        tone === 'destructive' && 'border-l-2 border-l-destructive',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {icon}
      </div>
      <p className={cn('text-lg font-bold tabular-nums', valueTone)}>
        {value}
        {suffix ? (
          <span className="text-xs font-semibold">{suffix}</span>
        ) : null}
      </p>
      {detail ? (
        <p className="truncate text-[10px] text-muted-foreground">{detail}</p>
      ) : null}
      {progress != null ? (
        <div className="mt-0.5 h-0.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full', progressTone)}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function InventarioDetalheView({
  inventarioId,
}: InventarioDetalheViewProps) {
  const [divergenciaReprovar, setDivergenciaReprovar] =
    useState<DivergenciaItem | null>(null);
  const [divergenciaRecontar, setDivergenciaRecontar] =
    useState<DivergenciaItem | null>(null);

  const {
    header,
    metricas,
    divergencias,
    divergenciasPendentesCount,
    divergenciasIdentificadasCount,
    modoAprovacaoDivergencias,
    filtroDivergencia,
    setFiltroDivergencia,
    aprovarDivergencia,
    reprovarDivergencia,
    solicitarRecontagem,
    processandoDivergenciaId,
    irParaDivergencias,
    demandas,
    resumoDemandas,
    pausar,
    finalizar,
    pausando,
    finalizando,
    carregando,
    exportarCsv,
  } = useInventarioDetalhe(inventarioId);

  const handleReprovarConfirm = async (motivoReprovacao: string) => {
    if (!divergenciaReprovar) {
      return;
    }

    await reprovarDivergencia(divergenciaReprovar.id, motivoReprovacao);
    setDivergenciaReprovar(null);
  };

  const handleRecontagemConfirm = async (payload: {
    responsavelId: number;
    prioridade: 'baixa' | 'media' | 'alta' | 'critica';
    motivo?: string;
  }) => {
    if (!divergenciaRecontar) {
      return;
    }

    await solicitarRecontagem(divergenciaRecontar.id, payload);
    setDivergenciaRecontar(null);
  };

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-4 md:px-margin-desktop md:py-5">
        <div className="mx-auto max-w-container space-y-3 md:space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1.5">
              <Link
                href="/inventario"
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-primary"
              >
                <ArrowLeft className="size-3" aria-hidden />
                Inventário
              </Link>
              <div>
                <h1 className="truncate text-lg font-semibold tracking-tight text-foreground md:text-xl">
                  {header.codigo}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-px text-[10px] font-semibold text-accent">
                    <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                    {header.statusLabel}
                  </span>
                  {header.tempoDecorridoLabel !== '—' ? (
                    <span className="text-[10px] text-muted-foreground">
                      {header.tempoDecorridoLabel}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              {modoAprovacaoDivergencias && divergenciasPendentesCount > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={irParaDivergencias}
                >
                  <TriangleAlert className="size-3.5" aria-hidden />
                  Aprovar divergências ({divergenciasPendentesCount})
                </Button>
              ) : divergenciasIdentificadasCount > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 border-outline-variant"
                  onClick={irParaDivergencias}
                >
                  <TriangleAlert className="size-3.5" aria-hidden />
                  Ver divergências ({divergenciasIdentificadasCount})
                </Button>
              ) : null}
              <Button asChild type="button" size="sm" className="h-8 gap-1.5">
                <Link href={`/inventario/${inventarioId}/demandas/nova`}>
                  <Plus className="size-3.5 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Adicionar demanda</span>
                  <span className="sm:hidden">Demanda</span>
                </Link>
              </Button>
              <Button
                disabled={pausando || carregando}
                variant="outline"
                type="button"
                size="sm"
                className="h-8 gap-1 border-outline-variant px-2.5 text-xs"
                onClick={() => void pausar()}
              >
                <Pause className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Pausar</span>
              </Button>
              <Button
                disabled={finalizando || carregando}
                type="button"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => void finalizar()}
              >
                <BadgeCheck className="size-3.5" aria-hidden />
                Finalizar
              </Button>
            </div>
          </div>

          {carregando ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-glass-bg py-8 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Carregando inventário…
            </div>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible sm:gap-3">
                <div
                  className={cn(
                    glassCard,
                    'flex min-w-[9.5rem] shrink-0 snap-start items-center gap-2.5 p-3 sm:min-w-0',
                  )}
                >
                  <MiniRingProgress percent={metricas.progressoPercent} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Progresso
                    </p>
                    <p className="text-lg font-bold tabular-nums text-primary">
                      {metricas.progressoPercent}
                      <span className="text-xs font-semibold">%</span>
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {metricas.itensContados.toLocaleString('pt-BR')} /{' '}
                      {metricas.itensTotal.toLocaleString('pt-BR')} itens
                    </p>
                  </div>
                </div>

                <MetricCard
                  label="Acurácia"
                  value={metricas.acuraciaPercent}
                  suffix="%"
                  detail={metricas.metaDeltaLabel}
                  tone="accent"
                  icon={
                    <BadgeCheck
                      className="size-3.5 shrink-0 text-accent"
                      aria-hidden
                    />
                  }
                  progress={metricas.acuraciaPercent}
                />

                <MetricCard
                  label="Divergências"
                  value={metricas.divergenciasCount}
                  suffix=" itens"
                  detail={`Impacto est.: ${metricas.impactoFinanceiroLabel}`}
                  tone="destructive"
                  icon={
                    <TriangleAlert
                      className="size-3.5 shrink-0 text-destructive"
                      aria-hidden
                    />
                  }
                />
              </div>

              <article className={glassCard}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant px-3 py-2">
                  <div className="min-w-0">
                    <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Progresso por demanda
                    </h2>
                    {resumoDemandas.total > 0 ? (
                      <p className="text-[10px] text-muted-foreground">
                        {resumoDemandas.concluidas} concluída(s) ·{' '}
                        {resumoDemandas.emAndamento} em andamento · média{' '}
                        {resumoDemandas.progressoMedio}%
                      </p>
                    ) : null}
                  </div>
                  <Button asChild type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[10px] text-primary">
                    <Link href={`/inventario/${inventarioId}/demandas/nova`}>
                      <Plus className="size-3" aria-hidden />
                      Nova demanda
                    </Link>
                  </Button>
                </div>

                <div className="divide-y divide-outline-variant/40 px-1.5 py-1">
                  {demandas.length > 0 ? (
                    demandas.map((demanda) => (
                      <DemandaProgressItem key={demanda.id} demanda={demanda} />
                    ))
                  ) : (
                    <div className="py-6 text-center">
                      <ClipboardList
                        className="mx-auto mb-2 size-5 text-muted-foreground/50"
                        aria-hidden
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Nenhuma demanda cadastrada neste inventário.
                      </p>
                      <Button
                        asChild
                        type="button"
                        variant="link"
                        size="sm"
                        className="mt-1 h-auto p-0 text-[11px]"
                      >
                        <Link href={`/inventario/${inventarioId}/demandas/nova`}>
                          Criar primeira demanda
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </article>

              <article className={glassCard} id="inventario-divergencias">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant px-3 py-2">
                  <div className="min-w-0">
                    <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Divergências
                      {modoAprovacaoDivergencias &&
                      divergenciasPendentesCount > 0 ? (
                        <span className="ml-2 rounded-full bg-destructive/15 px-2 py-px text-[10px] font-bold text-destructive">
                          {divergenciasPendentesCount} pendente(s)
                        </span>
                      ) : divergenciasIdentificadasCount > 0 ? (
                        <span className="ml-2 rounded-full bg-muted px-2 py-px text-[10px] font-bold text-muted-foreground">
                          {divergenciasIdentificadasCount} identificada(s)
                        </span>
                      ) : null}
                    </h2>
                    {modoAprovacaoDivergencias ? (
                      <p className="text-[10px] text-muted-foreground">
                        Aprove ou reprove cada divergência para ajustar o saldo.
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">
                        Prévia das divergências nas contagens. Finalize o
                        inventário para habilitar aprovação.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 border-outline-variant px-2 text-[10px]"
                      onClick={exportarCsv}
                    >
                      <Download className="size-3" aria-hidden />
                      CSV
                    </Button>
                  </div>
                </div>

                {modoAprovacaoDivergencias ? (
                  <div className="flex flex-wrap gap-1 border-b border-outline-variant px-3 py-2">
                    {FILTROS_DIVERGENCIA.map((filtro) => (
                      <Button
                        key={filtro.id}
                        type="button"
                        size="sm"
                        variant={
                          filtroDivergencia === filtro.id ? 'default' : 'ghost'
                        }
                        className="h-7 px-2.5 text-[10px]"
                        onClick={() => setFiltroDivergencia(filtro.id)}
                      >
                        {filtro.label}
                      </Button>
                    ))}
                  </div>
                ) : null}

                <div className="overflow-x-auto">
                  <table className={compactTableClassName}>
                    <thead>
                      <tr className={compactTableHeadRowClassName}>
                        {DIVERGENCIA_HEADERS.map((h) => (
                          <th
                            key={h.label || 'actions'}
                            className={compactTableHeadCellClassName(h.className)}
                          >
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={compactTableBodyClassName}>
                      {divergencias.length > 0 ? (
                        divergencias.map((dv) => (
                          <DivergenciaRow
                            key={dv.id}
                            item={dv}
                            processando={processandoDivergenciaId === dv.id}
                            onAprovar={(id) => void aprovarDivergencia(id)}
                            onReprovar={(id) => {
                              const item = divergencias.find(
                                (divergencia) => divergencia.id === id,
                              );
                              if (item) {
                                setDivergenciaReprovar(item);
                              }
                            }}
                            onRecontar={(id) => {
                              const item = divergencias.find(
                                (divergencia) => divergencia.id === id,
                              );
                              if (item) {
                                setDivergenciaRecontar(item);
                              }
                            }}
                          />
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={DIVERGENCIA_HEADERS.length}
                            className={compactTableEmptyCellClassName}
                          >
                            {modoAprovacaoDivergencias
                              ? filtroDivergencia === 'pendente'
                                ? 'Nenhuma divergência pendente de aprovação.'
                                : 'Nenhuma divergência neste filtro.'
                              : 'Nenhuma divergência identificada nas contagens.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>

              <ModalReprovarDivergencia
                open={divergenciaReprovar != null}
                divergencia={divergenciaReprovar}
                processando={
                  divergenciaReprovar != null &&
                  processandoDivergenciaId === divergenciaReprovar.id
                }
                onOpenChange={(aberto) => {
                  if (!aberto) {
                    setDivergenciaReprovar(null);
                  }
                }}
                onConfirm={(motivo) => void handleReprovarConfirm(motivo)}
              />

              <ModalSolicitarRecontagemDivergencia
                open={divergenciaRecontar != null}
                divergencia={divergenciaRecontar}
                processando={
                  divergenciaRecontar != null &&
                  processandoDivergenciaId === divergenciaRecontar.id
                }
                onOpenChange={(aberto) => {
                  if (!aberto) {
                    setDivergenciaRecontar(null);
                  }
                }}
                onConfirm={(payload) => void handleRecontagemConfirm(payload)}
              />
            </>
          )}
        </div>
      </main>
    </SidebarMain>
  );
}
