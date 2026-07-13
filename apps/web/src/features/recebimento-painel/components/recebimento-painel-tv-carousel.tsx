'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button, cn } from '@lilog/ui';
import { ChevronLeft, ChevronRight, Minimize2 } from 'lucide-react';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { RecebimentoAlertasTicker } from '@/features/recebimento-painel/components/recebimento-alertas-ticker';
import { RecebimentoAnomaliasPanel } from '@/features/recebimento-painel/components/recebimento-anomalias-panel';
import { RecebimentoDocasPanel } from '@/features/recebimento-painel/components/recebimento-docas-panel';
import { RecebimentoFilaPanel } from '@/features/recebimento-painel/components/recebimento-fila-panel';
import { RecebimentoKpiStrip } from '@/features/recebimento-painel/components/recebimento-kpi-strip';
import { RecebimentoSessaoPanel } from '@/features/recebimento-painel/components/recebimento-sessao-panel';
import { RecebimentoTvHeader } from '@/features/recebimento-painel/components/recebimento-tv-header';
import {
  RankingEmpresaPanel,
  RecebimentosHoraChart,
} from '@/features/recebimento-painel/components/recebimento-painel-charts';
import { RecebimentoPipelinePanel } from '@/features/recebimento-painel/components/recebimento-pipeline-panel';
import { RecebimentoProdutividadePanel } from '@/features/recebimento-painel/components/recebimento-produtividade-panel';
import type { RecebimentoPainelSnapshot } from '@/features/recebimento-painel/types/recebimento-painel.schema';

const SLIDE_INTERVAL_MS = 10_000;

const SLIDES = [
  { id: 'operacao', label: 'Pipeline · Docas · Empresa' },
  { id: 'indicadores', label: 'Hora a hora · Avarias · Sessão' },
  { id: 'produtividade', label: 'Produtividade da Equipe' },
  { id: 'fila', label: 'Fila ao vivo' },
] as const;

export function RecebimentoPainelTvCarousel({
  snapshot,
  isLoading = false,
  onExit,
}: {
  snapshot: RecebimentoPainelSnapshot;
  isLoading?: boolean;
  onExit: () => void;
}) {
  const { unidadeSelecionada } = useUnidadeContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeSlide = SLIDES[activeIndex] ?? SLIDES[0];

  const goToSlide = useCallback((index: number) => {
    setActiveIndex((index + SLIDES.length) % SLIDES.length);
    setProgress(0);
  }, []);

  const goNext = useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const startedAt = Date.now();

    const tick = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setProgress(Math.min(100, (elapsed / SLIDE_INTERVAL_MS) * 100));
    }, 100);

    const advance = window.setTimeout(() => {
      goNext();
    }, SLIDE_INTERVAL_MS);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(advance);
    };
  }, [activeIndex, isPaused, goNext]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrev();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="relative shrink-0 pr-10">
        <RecebimentoTvHeader
          unidadeNome={unidadeSelecionada?.nome ?? 'Unidade'}
          dataReferencia={snapshot.dataReferencia}
          turnoLabel={snapshot.turnoLabel}
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 size-8 text-white/40 hover:bg-white/10 hover:text-white"
          onClick={onExit}
          aria-label="Sair da tela cheia"
        >
          <Minimize2 className="size-4" aria-hidden />
        </Button>
      </div>

      <RecebimentoKpiStrip kpis={snapshot.kpis} />

      {isLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-white/40">
          Atualizando painel...
        </div>
      ) : (
      <div
        className="relative min-h-0 flex-1"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <SlidePanel active={activeSlide.id === 'operacao'}>
          <div className="grid h-full min-h-0 grid-cols-12 gap-3">
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
              compact
            />
          </div>
        </SlidePanel>

        <SlidePanel active={activeSlide.id === 'indicadores'}>
          <div className="grid h-full min-h-0 grid-cols-12 gap-3">
            <RecebimentosHoraChart
              pontos={snapshot.recebimentosPorHora}
              totalPrevistoDia={snapshot.totalPrevistoDia}
              className="col-span-12 min-h-[200px] lg:col-span-5"
            />
            <RecebimentoAnomaliasPanel
              anomalias={snapshot.anomalias}
              className="col-span-12 min-h-[200px] lg:col-span-4"
              compact
            />
            <RecebimentoSessaoPanel
              sessao={snapshot.sessaoOperacional}
              className="col-span-12 min-h-[200px] lg:col-span-3"
            />
          </div>
        </SlidePanel>

        <SlidePanel active={activeSlide.id === 'produtividade'}>
          <div className="flex h-full min-h-0 flex-col">
            <RecebimentoProdutividadePanel
              produtividade={snapshot.produtividadeEquipe}
              className="min-h-[200px] flex-1"
              compact
            />
          </div>
        </SlidePanel>

        <SlidePanel active={activeSlide.id === 'fila'}>
          <div className="flex h-full min-h-0 flex-col">
            <RecebimentoFilaPanel fila={snapshot.fila} className="min-h-[200px] flex-1" />
          </div>
        </SlidePanel>
      </div>
      )}

      <div className="flex shrink-0 flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-white/50 hover:bg-white/10 hover:text-white"
              onClick={goPrev}
              aria-label="Slide anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-white/50 hover:bg-white/10 hover:text-white"
              onClick={goNext}
              aria-label="Próximo slide"
            >
              <ChevronRight className="size-4" />
            </Button>
            <p className="text-[11px] font-medium text-white/60">
              {activeSlide.label}
              <span className="ml-2 text-white/30">
                {activeIndex + 1}/{SLIDES.length}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {SLIDES.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(index)}
                className={cn(
                  'rounded-full transition-all',
                  index === activeIndex
                    ? 'size-2 bg-primary'
                    : 'size-1.5 bg-white/25 hover:bg-white/40',
                )}
                aria-label={`Ir para ${slide.label}`}
                aria-current={index === activeIndex ? 'true' : undefined}
              />
            ))}
            <span className="ml-1 text-[10px] tabular-nums text-white/30">
              {isPaused ? 'Pausado' : '10s'}
            </span>
          </div>
        </div>

        <div className="h-0.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <RecebimentoAlertasTicker alertas={snapshot.alertas} />
      </div>
    </div>
  );
}

function SlidePanel({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 overflow-y-auto transition-opacity duration-700 ease-in-out',
        active
          ? 'pointer-events-auto z-10 opacity-100'
          : 'pointer-events-none z-0 opacity-0',
      )}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}
