'use client';

import { Warehouse } from 'lucide-react';

import { cn } from '@lilog/ui';

import { DashboardChartPanel } from '@/features/dashboard-operacional/components/dashboard-charts';
import type { DocaItem } from '@/features/recebimento/types/recebimento-lista.schema';

const DOCA_STATUS_STYLES = {
  ocupada: 'border-tertiary/35 bg-tertiary/10',
  disponivel: 'border-white/8 bg-white/[0.02]',
  manutencao: 'border-amber-500/35 bg-amber-500/10',
} as const;

const DOCA_STATUS_DOT = {
  ocupada: 'bg-tertiary',
  disponivel: 'bg-white/25',
  manutencao: 'bg-amber-400',
} as const;

function formatPlacaCompact(placa: string): string {
  return placa.replace(/-/g, '').slice(0, 7);
}

export function RecebimentoDocasPanel({
  docas,
  className,
  compact = false,
}: {
  docas: DocaItem[];
  className?: string;
  compact?: boolean;
}) {
  const ocupadas = docas.filter((doca) => doca.status === 'ocupada').length;
  const manutencao = docas.filter((doca) => doca.status === 'manutencao').length;

  return (
    <DashboardChartPanel
      titulo="Mapa de Docas"
      descricao={`${ocupadas} ocup. · ${docas.length - ocupadas - manutencao} livres · ${manutencao} manut.`}
      icon={Warehouse}
      className={cn('min-h-0', className)}
      bodyClassName={compact ? 'min-h-0 flex-1 overflow-y-auto p-1.5' : 'p-2'}
    >
      <div
        className={cn(
          'grid gap-1',
          compact
            ? 'grid-cols-6 xl:grid-cols-8'
            : 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6',
        )}
      >
        {docas.map((doca) => (
          <article
            key={doca.numero}
            title={
              doca.status === 'ocupada' && doca.placa
                ? `${doca.placa}${doca.tempoOcupacao ? ` · ${doca.tempoOcupacao}` : ''}`
                : doca.status === 'manutencao'
                  ? `Manutenção${doca.retornoManutencao ? ` · retorno ${doca.retornoManutencao}` : ''}`
                  : 'Disponível'
            }
            className={cn(
              'flex min-w-0 flex-col rounded border px-1 py-1 transition-colors',
              DOCA_STATUS_STYLES[doca.status],
              doca.isPrioritaria && 'ring-1 ring-destructive/40',
            )}
          >
            <div className="flex items-center justify-between gap-0.5">
              <span className="text-[8px] font-bold tabular-nums text-white/70">
                {doca.numero}
              </span>
              <span
                className={cn(
                  'size-1 shrink-0 rounded-full',
                  DOCA_STATUS_DOT[doca.status],
                  doca.status === 'ocupada' && 'animate-pulse',
                )}
                aria-hidden
              />
            </div>

            {doca.status === 'ocupada' && doca.placa ? (
              <p className="mt-0.5 truncate font-mono text-[8px] font-semibold leading-tight text-white/90">
                {formatPlacaCompact(doca.placa)}
              </p>
            ) : doca.status === 'manutencao' ? (
              <p className="mt-0.5 truncate text-[7px] font-semibold uppercase leading-tight text-amber-400/90">
                {doca.etiquetaManutencao ?? 'MNT'}
              </p>
            ) : (
              <p className="mt-0.5 text-[7px] leading-tight text-white/25">—</p>
            )}

            {doca.status === 'ocupada' && doca.tempoOcupacao ? (
              <p className="truncate text-[7px] tabular-nums leading-tight text-white/35">
                {doca.tempoOcupacao}
              </p>
            ) : doca.status === 'manutencao' && doca.retornoManutencao ? (
              <p className="truncate text-[7px] tabular-nums leading-tight text-amber-400/60">
                {doca.retornoManutencao}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </DashboardChartPanel>
  );
}
