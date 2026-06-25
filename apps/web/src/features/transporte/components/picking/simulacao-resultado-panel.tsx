'use client';

import { cn } from '@lilog/ui';
import {
  Clock3,
  FileText,
  MapPin,
  Package,
  Users,
} from 'lucide-react';

import type { ResultadoSimulacao } from '@/features/transporte/types/geracao-mapas-separacao.schema';

const panelClassName = cn(
  'overflow-hidden rounded-xl border border-outline-variant',
  'bg-glass-bg shadow-inner-glow backdrop-blur-glass',
);

type SimulacaoResultadoPanelProps = {
  simulacao: ResultadoSimulacao | null;
  pronto: boolean;
};

export function SimulacaoResultadoPanel({
  simulacao,
  pronto,
}: SimulacaoResultadoPanelProps) {
  return (
    <section className={cn(panelClassName, 'space-y-4 p-5')}>
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileText className="size-4 text-primary" aria-hidden />
          Simulação da Geração
        </h2>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold',
            pronto
              ? 'bg-tertiary/15 text-tertiary'
              : 'bg-surface-high text-muted-foreground',
          )}
        >
          {pronto
            ? `${simulacao?.totalMapas ?? 0} mapa(s) simulado(s)`
            : 'Selecione pedidos para simular'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <ResumoCard
          icon={FileText}
          label="Mapas"
          value={pronto ? String(simulacao?.totalMapas ?? 0) : '—'}
          highlight
        />
        <ResumoCard
          icon={Package}
          label="Pedidos"
          value={pronto ? String(simulacao?.totalPedidos ?? 0) : '—'}
        />
        <ResumoCard
          icon={Package}
          label="Linhas"
          value={pronto ? String(simulacao?.totalLinhas ?? 0) : '—'}
          accent="tertiary"
        />
        <ResumoCard
          icon={Package}
          label="Volumes"
          value={pronto ? String(simulacao?.totalVolumes ?? 0) : '—'}
        />
        <ResumoCard
          icon={Package}
          label="Peso (kg)"
          value={pronto ? String(simulacao?.pesoTotal ?? 0) : '—'}
          accent="secondary"
        />
        <ResumoCard
          icon={MapPin}
          label="Distância (m)"
          value={pronto ? String(simulacao?.distanciaTotal ?? 0) : '—'}
        />
        <ResumoCard
          icon={Clock3}
          label="Tempo (min)"
          value={pronto ? String(simulacao?.tempoTotalMin ?? 0) : '—'}
        />
        <ResumoCard
          icon={Users}
          label="Operadores"
          value={pronto ? String(simulacao?.operadoresNecessarios ?? 0) : '—'}
          accent="tertiary"
        />
      </div>

      {pronto && simulacao && simulacao.mapas.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-outline-variant">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-low/60">
                <th className="px-3 py-2 text-left font-semibold">Mapa</th>
                <th className="px-3 py-2 text-right font-semibold">Pedidos</th>
                <th className="px-3 py-2 text-right font-semibold">Linhas</th>
                <th className="px-3 py-2 text-right font-semibold">Volumes</th>
                <th className="px-3 py-2 text-right font-semibold">Peso</th>
                <th className="px-3 py-2 text-right font-semibold">Distância</th>
                <th className="px-3 py-2 text-right font-semibold">Tempo</th>
              </tr>
            </thead>
            <tbody>
              {simulacao.mapas.map((mapa) => (
                <tr
                  key={mapa.id}
                  className="border-b border-outline-variant/50"
                >
                  <td className="px-3 py-2 font-medium">{mapa.titulo}</td>
                  <td className="px-3 py-2 text-right">{mapa.qtdPedidos}</td>
                  <td className="px-3 py-2 text-right">{mapa.qtdLinhas}</td>
                  <td className="px-3 py-2 text-right">{mapa.qtdVolumes}</td>
                  <td className="px-3 py-2 text-right">{mapa.peso}kg</td>
                  <td className="px-3 py-2 text-right">
                    {mapa.distanciaEstimada}m
                  </td>
                  <td className="px-3 py-2 text-right">
                    {mapa.tempoEstimadoMin}min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ResumoCard({
  icon: Icon,
  label,
  value,
  highlight,
  accent,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  highlight?: boolean;
  accent?: 'tertiary' | 'secondary';
}) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-low/40 p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon
          className={cn(
            'size-3.5',
            highlight && 'text-primary',
            accent === 'tertiary' && 'text-tertiary',
            accent === 'secondary' && 'text-secondary',
          )}
        />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        className={cn(
          'text-xl font-bold',
          highlight && 'text-primary',
          accent === 'tertiary' && 'text-tertiary',
          accent === 'secondary' && 'text-secondary',
        )}
      >
        {value}
      </p>
    </div>
  );
}
