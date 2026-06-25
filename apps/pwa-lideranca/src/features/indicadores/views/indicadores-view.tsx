import { cn } from '@lilog/ui';
import {
  AlertCircle,
  Loader2,
  PackageOpen,
  RefreshCw,
  ShieldX,
  Truck,
} from 'lucide-react';

import { AlertasCompletosSheet } from '@/features/indicadores/components/alertas-completos-sheet';
import { AlertasResumoList } from '@/features/indicadores/components/alertas-resumo-list';
import { ForaDoEixoPanel } from '@/features/indicadores/components/fora-do-eixo-panel';
import { IndicadoresFilterChips } from '@/features/indicadores/components/indicadores-filter-chips';
import { IndicadoresKpiStrip } from '@/features/indicadores/components/indicadores-kpi-strip';
import { PipelineResumoCards } from '@/features/indicadores/components/pipeline-resumo-cards';
import { SectionHeader } from '@/features/indicadores/components/section-header';
import { TransporteDetalheSheet } from '@/features/indicadores/components/transporte-detalhe-sheet';
import { TransporteRiscoCard } from '@/features/indicadores/components/transporte-risco-card';
import { TurnoHeroCard } from '@/features/indicadores/components/turno-hero-card';
import { useIndicadoresPwa } from '@/features/indicadores/hooks/use-indicadores-pwa';
import { SessaoSubHeader } from '@/features/sessao-presenca/components/sessao-sub-header';
import { hapticMedium } from '@/lib/haptics';

function IndicadoresSkeleton() {
  return (
    <div className="space-y-3 px-margin-mobile">
      <div className="h-32 animate-pulse rounded-xl bg-surface-container" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-20 w-[112px] shrink-0 animate-pulse rounded-xl bg-surface-container"
          />
        ))}
      </div>
      <div className="h-24 animate-pulse rounded-xl bg-surface-container" />
      <div className="h-20 animate-pulse rounded-xl bg-surface-container" />
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  tone = 'default',
}: {
  icon: typeof PackageOpen;
  title: string;
  description: string;
  tone?: 'default' | 'danger' | 'muted';
}) {
  const iconTone =
    tone === 'danger'
      ? 'bg-destructive/10 text-destructive'
      : tone === 'muted'
        ? 'bg-surface-container text-on-surface-variant'
        : 'bg-secondary/10 text-secondary';

  return (
    <div className="mx-margin-mobile flex flex-col items-center rounded-2xl border border-dashed border-outline-variant bg-surface px-6 py-12 text-center shadow-sm">
      <div
        className={cn(
          'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
          iconTone,
        )}
      >
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="text-headline-md font-semibold text-on-surface">{title}</h2>
      <p className="mt-2 max-w-xs text-body-sm leading-relaxed text-on-surface-variant">
        {description}
      </p>
    </div>
  );
}

export function IndicadoresView() {
  const {
    unidadeNome,
    semUnidade,
    semExpedicaoAtiva,
    semPermissao,
    snapshot,
    transportesFiltrados,
    transportesForaDoEixo,
    alertasOrdenados,
    counts,
    kpiResumo,
    filtroRapido,
    setFiltroRapido,
    transporteSelecionado,
    mapasTransporteSelecionado,
    transporteSelecionadoId,
    setTransporteSelecionadoId,
    abrirTransporte,
    alertasSheetOpen,
    setAlertasSheetOpen,
    isLoading,
    isRefreshing,
    loadError,
    atualizadoLabel,
    triggerRefresh,
  } = useIndicadoresPwa();

  const canShowPainel =
    !semUnidade && !semExpedicaoAtiva && !semPermissao && !loadError;

  return (
    <div className="page-enter flex flex-col pb-8">
      <SessaoSubHeader
        backTo="/"
        backLabel="Voltar ao menu"
        title="Indicadores"
        subtitle={
          isLoading
            ? 'Carregando operação...'
            : canShowPainel
              ? `Atualizado ${atualizadoLabel}`
              : unidadeNome ?? 'Expedição'
        }
        trailing={
          <button
            type="button"
            disabled={isRefreshing || semUnidade}
            onClick={() => {
              hapticMedium();
              void triggerRefresh();
            }}
            aria-label="Atualizar indicadores"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-all active:scale-90 disabled:opacity-50 touch-manipulation',
              isRefreshing && 'bg-secondary/10 text-secondary',
            )}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
          </button>
        }
      />

      {isLoading ? (
        <IndicadoresSkeleton />
      ) : semUnidade ? (
        <EmptyState
          icon={AlertCircle}
          title="Selecione uma unidade"
          description="Escolha a unidade no menu principal para visualizar os indicadores da expedição."
        />
      ) : semPermissao ? (
        <EmptyState
          icon={ShieldX}
          tone="danger"
          title="Acesso restrito"
          description={
            loadError ??
            'Você não possui permissão para visualizar os indicadores de expedição.'
          }
        />
      ) : semExpedicaoAtiva ? (
        <EmptyState
          icon={PackageOpen}
          tone="muted"
          title="Nenhuma expedição ativa"
          description="Não há transportes ou lote de upload para hoje nesta unidade."
        />
      ) : loadError ? (
        <EmptyState
          icon={AlertCircle}
          tone="danger"
          title="Erro ao carregar"
          description={loadError}
        />
      ) : (
        <div className="scroll-native space-y-3 overflow-y-auto px-margin-mobile">
          <div className="indicadores-stagger space-y-3">
            <TurnoHeroCard turno={snapshot.turno} unidadeNome={unidadeNome} />

            <IndicadoresKpiStrip
              prioritariosAtrasados={kpiResumo.prioritariosAtrasados}
              emRisco={kpiResumo.emRisco}
              sla={kpiResumo.sla}
              prioridadesPendentes={kpiResumo.prioridadesPendentes}
            />

            <ForaDoEixoPanel
              transportes={transportesForaDoEixo}
              onVerTransporte={abrirTransporte}
              onVerTodos={() => setFiltroRapido('prioritarios_atrasados')}
            />

            <PipelineResumoCards pipeline={snapshot.pipeline} />

            <AlertasResumoList
              alertas={alertasOrdenados}
              onVerTodos={() => setAlertasSheetOpen(true)}
            />

            <section className="space-y-2 pb-1">
              <SectionHeader icon={Truck} title="Transportes" badge={counts.todos} compact />
              <IndicadoresFilterChips
                active={filtroRapido}
                counts={counts}
                onChange={setFiltroRapido}
                disabled={isRefreshing}
              />
              {transportesFiltrados.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-outline-variant bg-surface px-4 py-8 text-center">
                  <p className="text-body-sm font-medium text-on-surface">
                    Nenhum transporte neste filtro
                  </p>
                  <p className="mt-1 text-label-sm text-on-surface-variant">
                    Tente outro filtro para ver mais resultados.
                  </p>
                </div>
              ) : (
                <ul className={cn('space-y-1.5', isRefreshing && 'opacity-70')}>
                  {transportesFiltrados.map((transporte) => (
                    <li key={transporte.id}>
                      <TransporteRiscoCard
                        transporte={transporte}
                        onClick={() => abrirTransporte(transporte)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      <TransporteDetalheSheet
        open={transporteSelecionadoId !== null}
        transporte={transporteSelecionado}
        mapas={mapasTransporteSelecionado}
        onOpenChange={(open) => {
          if (!open) {
            setTransporteSelecionadoId(null);
          }
        }}
      />

      <AlertasCompletosSheet
        open={alertasSheetOpen}
        alertas={alertasOrdenados}
        onOpenChange={setAlertasSheetOpen}
      />
    </div>
  );
}
