'use client';

import { AlertTriangle } from 'lucide-react';

import { cn } from '@lilog/ui';

import {
  DashboardChartPanel,
  DonutChart,
} from '@/features/dashboard-operacional/components/dashboard-charts';
import type {
  AnomaliaCategoriaPainel,
  AnomaliasPainel,
} from '@/features/recebimento-painel/types/recebimento-painel.schema';

const CATEGORIA_COLORS: Record<AnomaliaCategoriaPainel, string> = {
  falta: 'hsl(0 72% 55%)',
  sobra: 'hsl(38 92% 50%)',
  avaria: 'hsl(25 95% 53%)',
  divergencia_peso: 'hsl(199 89% 48%)',
};

export function RecebimentoAnomaliasPanel({
  anomalias,
  className,
  compact = false,
}: {
  anomalias: AnomaliasPainel;
  className?: string;
  compact?: boolean;
}) {
  const { resumo, rankingOrigens } = anomalias;
  const segments = resumo.porCategoria
    .filter((item) => item.count > 0)
    .map((item) => ({
      value: item.count,
      color: CATEGORIA_COLORS[item.categoria],
      label: item.label,
    }));

  const maxRanking = Math.max(...rankingOrigens.map((item) => item.count), 1);
  const rankingVisivel = compact
    ? rankingOrigens.slice(0, 3)
    : rankingOrigens.slice(0, 6);
  const donutSize = compact ? 140 : 126;

  return (
    <DashboardChartPanel
      titulo="Anomalias do Dia"
      descricao={`${resumo.totalOcorrencias} ocorrência${resumo.totalOcorrencias !== 1 ? 's' : ''} · ${resumo.recebimentosAfetados} veículo${resumo.recebimentosAfetados !== 1 ? 's' : ''}`}
      icon={AlertTriangle}
      className={cn('min-h-0', className)}
      bodyClassName={cn(
        'flex min-h-0 flex-col gap-1.5',
        compact ? 'p-1.5' : 'gap-2 p-2',
      )}
    >
      <div className="min-h-0 shrink-0">
        {segments.length > 0 ? (
          <DonutChart
            segments={segments}
            centerValue={String(resumo.totalOcorrencias)}
            centerLabel="total"
            size={donutSize}
          />
        ) : (
          <div className="flex items-center gap-4">
            <div
              className="relative flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5"
              style={{ width: donutSize, height: donutSize }}
            >
              <span className="text-lg font-bold tabular-nums text-white/40">
                0
              </span>
            </div>
            <p className="text-[11px] text-white/45">
              Nenhuma anomalia registrada no período
            </p>
          </div>
        )}
      </div>

      {rankingVisivel.length > 0 ? (
        <div className="min-h-0 flex-1 border-t border-white/5 pt-1.5">
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-white/40">
            Origens com mais ocorrências
          </p>
          <ul className="space-y-1">
            {rankingVisivel.map((item, index) => (
              <li key={item.centro}>
                <div className="mb-0.5 flex items-center justify-between gap-2 text-[10px]">
                  <span className="truncate text-white/75" title={item.centro}>
                    {index + 1}. {item.nome}
                  </span>
                  <span className="shrink-0 tabular-nums text-white/45">
                    {item.count} · {item.percentual.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{
                      width: `${(item.count / maxRanking) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DashboardChartPanel>
  );
}
