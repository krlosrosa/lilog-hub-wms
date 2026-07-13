'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import {
  ArrowLeft,
  Loader2,
  Maximize2,
  PackageCheck,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { RecebimentoAlertasTicker } from '@/features/recebimento-painel/components/recebimento-alertas-ticker';
import { RecebimentoAnomaliasPanel } from '@/features/recebimento-painel/components/recebimento-anomalias-panel';
import { RecebimentoDocasPanel } from '@/features/recebimento-painel/components/recebimento-docas-panel';
import { RecebimentoFilaPanel } from '@/features/recebimento-painel/components/recebimento-fila-panel';
import { RecebimentoKpiStrip } from '@/features/recebimento-painel/components/recebimento-kpi-strip';
import {
  DEFAULT_RECEBIMENTO_PAINEL_FILTRO,
  RecebimentoPainelFiltroSheet,
  type RecebimentoPainelFiltroSheetState,
} from '@/features/recebimento-painel/components/recebimento-painel-filtro-sheet';
import { RecebimentoPainelTvCarousel } from '@/features/recebimento-painel/components/recebimento-painel-tv-carousel';
import { RecebimentoSessaoPanel } from '@/features/recebimento-painel/components/recebimento-sessao-panel';
import {
  RankingEmpresaPanel,
  RecebimentosHoraChart,
} from '@/features/recebimento-painel/components/recebimento-painel-charts';
import { RecebimentoPipelinePanel } from '@/features/recebimento-painel/components/recebimento-pipeline-panel';
import { RecebimentoProdutividadePanel } from '@/features/recebimento-painel/components/recebimento-produtividade-panel';
import {
  useRecebimentoPainel,
} from '@/features/recebimento-painel/hooks/use-recebimento-painel';
import { formatarRotuloIntervalo } from '@/features/recebimento-painel/lib/intervalo-data';
import type { RecebimentoPainelSnapshot } from '@/features/recebimento-painel/types/recebimento-painel.schema';

function PainelBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-[20%] top-0 size-[50vmax] rounded-full bg-primary/12 blur-[100px]" />
      <div className="absolute -right-[10%] top-[10%] size-[40vmax] rounded-full bg-tertiary/8 blur-[90px]" />
      <div
        className="absolute inset-0 opacity-[0.2] blueprint-grid"
        style={{ backgroundColor: 'transparent' }}
      />
    </div>
  );
}

function PainelNormalContent({
  snapshot,
  isLoading,
  isRefreshing,
  erro,
  intervaloLabel,
  onToggleFullscreen,
  onOpenFiltros,
  onRefresh,
}: {
  snapshot: RecebimentoPainelSnapshot;
  isLoading: boolean;
  isRefreshing: boolean;
  erro: string | null;
  intervaloLabel: string;
  onToggleFullscreen: () => void;
  onOpenFiltros: () => void;
  onRefresh: () => void;
}) {
  const { unidadeSelecionada } = useUnidadeContext();

  return (
    <>
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-white/50">
            <PackageCheck className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-widest">
              Gestão à vista
            </span>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-white md:text-2xl">
            Painel Recebimento
          </h1>
          <p className="mt-0.5 text-sm text-white/40">
            {unidadeSelecionada?.nome ?? 'Unidade'} · {snapshot.dataReferencia}{' '}
            · {snapshot.turnoLabel}
          </p>
          <p className="mt-0.5 text-xs text-white/30">
            Período: {intervaloLabel}
          </p>
          {erro ? (
            <p className="mt-1 text-xs text-destructive">{erro}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={onOpenFiltros}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Filtros
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn('size-4', isRefreshing && 'animate-spin')}
              aria-hidden
            />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            asChild
          >
            <Link href="/recebimento">
              <ArrowLeft className="size-4" aria-hidden />
              Voltar
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={onToggleFullscreen}
          >
            <Maximize2 className="size-4" aria-hidden />
            Tela cheia
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-white/50">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          Carregando painel...
        </div>
      ) : (
        <>
          <RecebimentoKpiStrip kpis={snapshot.kpis} />

          <div className="grid min-h-0 flex-1 grid-cols-12 gap-3">
            <RecebimentoPipelinePanel
              pipeline={snapshot.pipeline}
              className="col-span-12 min-h-[300px] lg:col-span-4"
            />
            <RecebimentoDocasPanel
              docas={snapshot.docas}
              className="col-span-12 min-h-[180px] lg:col-span-4"
            />
            <RankingEmpresaPanel
              ranking={snapshot.rankingPorEmpresa}
              className="col-span-12 min-h-[180px] lg:col-span-4"
            />

            <RecebimentosHoraChart
              pontos={snapshot.recebimentosPorHora}
              totalPrevistoDia={snapshot.totalPrevistoDia}
              className="col-span-12 min-h-[200px] lg:col-span-5"
            />

            <RecebimentoAnomaliasPanel
              anomalias={snapshot.anomalias}
              className="col-span-12 min-h-[200px] lg:col-span-4"
            />

            <RecebimentoSessaoPanel
              sessao={snapshot.sessaoOperacional}
              className="col-span-12 min-h-[200px] lg:col-span-3"
            />

            <RecebimentoProdutividadePanel
              produtividade={snapshot.produtividadeEquipe}
              className="col-span-12 min-h-[280px] lg:col-span-5"
            />

            <RecebimentoFilaPanel
              fila={snapshot.fila}
              className="col-span-12 min-h-[200px]"
            />
          </div>

          <RecebimentoAlertasTicker alertas={snapshot.alertas} />
        </>
      )}
    </>
  );
}

export function RecebimentoPainelView() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filtrosSheetAberto, setFiltrosSheetAberto] = useState(false);
  const [filtro, setFiltro] = useState<RecebimentoPainelFiltroSheetState>(
    DEFAULT_RECEBIMENTO_PAINEL_FILTRO,
  );

  const { snapshot, isLoading, isRefreshing, erro, refetch } =
    useRecebimentoPainel({ intervalo: filtro });

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((current) => !current);
  }, []);

  const aplicarFiltros = useCallback((proximo: RecebimentoPainelFiltroSheetState) => {
    setFiltro(proximo);
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen]);

  if (isFullscreen) {
    return (
      <div
        className="dashboard-tv-screen fixed inset-0 z-[100] flex h-dvh flex-col overflow-hidden bg-[hsl(240_6%_5%)] text-white"
        data-dashboard-tv
      >
        <PainelBackground />
        <div className="relative flex min-h-0 flex-1 flex-col px-4 py-3 md:px-6 md:py-4">
          <RecebimentoPainelTvCarousel
            snapshot={snapshot}
            isLoading={isLoading}
            onExit={toggleFullscreen}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative min-h-[calc(100dvh-4rem)] overflow-hidden rounded-xl border border-outline-variant bg-[hsl(240_6%_5%)] text-white',
      )}
    >
      <PainelBackground />
      <div className="relative flex min-h-[calc(100dvh-4rem)] flex-col gap-3 p-4 md:p-6">
        <PainelNormalContent
          snapshot={snapshot}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          erro={erro}
          intervaloLabel={formatarRotuloIntervalo(filtro)}
          onToggleFullscreen={toggleFullscreen}
          onOpenFiltros={() => setFiltrosSheetAberto(true)}
          onRefresh={() => void refetch()}
        />
      </div>

      <RecebimentoPainelFiltroSheet
        open={filtrosSheetAberto}
        onOpenChange={setFiltrosSheetAberto}
        filtros={filtro}
        onAplicar={aplicarFiltros}
      />
    </div>
  );
}
