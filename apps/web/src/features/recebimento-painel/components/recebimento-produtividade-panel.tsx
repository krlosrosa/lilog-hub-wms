'use client';

import { BarChart3, Clock, Truck, Users } from 'lucide-react';

import { cn } from '@lilog/ui';

import { DashboardChartPanel } from '@/features/dashboard-operacional/components/dashboard-charts';
import type {
  ProdutividadeEquipePainel,
  ProdutividadeOperadorPainel,
  SessaoStatusOperacionalPainel,
} from '@/features/recebimento-painel/types/recebimento-painel.schema';

const STATUS_OPERACIONAL_LABELS: Record<SessaoStatusOperacionalPainel, string> = {
  atuando: 'Atuando',
  disponivel: 'Disponível',
  em_pausa: 'Em pausa',
  indisponivel: 'Indisponível',
};

const STATUS_OPERACIONAL_STYLES: Record<SessaoStatusOperacionalPainel, string> = {
  atuando: 'bg-tertiary/15 text-tertiary',
  disponivel: 'bg-amber-500/15 text-amber-400',
  em_pausa: 'bg-sky-500/15 text-sky-400',
  indisponivel: 'bg-white/5 text-white/35',
};

function formatarTempoMedio(minutos: number | null): string {
  if (minutos == null || minutos <= 0) {
    return '—';
  }

  if (minutos < 60) {
    return `${Math.round(minutos)} min`;
  }

  const horas = Math.floor(minutos / 60);
  const resto = Math.round(minutos % 60);
  return resto > 0 ? `${horas}h ${resto}min` : `${horas}h`;
}

function KpiChip({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-md border border-white/8 bg-black/20 px-2.5 py-2 text-center">
      <Icon className="mx-auto size-3.5 text-white/30" aria-hidden />
      <p className="mt-1 text-sm font-bold tabular-nums text-white">{value}</p>
      <p className="text-[8px] uppercase tracking-wide text-white/30">{label}</p>
    </div>
  );
}

function OperadorRankingItem({
  posicao,
  operador,
  maxCarros,
  compact,
}: {
  posicao: number;
  operador: ProdutividadeOperadorPainel;
  maxCarros: number;
  compact?: boolean;
}) {
  const pct =
    maxCarros > 0 ? Math.round((operador.carros / maxCarros) * 1000) / 10 : 0;

  return (
    <li className="rounded-md border border-white/8 bg-black/20 px-2.5 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold tabular-nums text-white/70">
              {posicao}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-white/90">
                {operador.nome}
              </p>
              <p className="truncate text-[9px] text-white/35">{operador.cargo}</p>
            </div>
          </div>

          {!compact && operador.atividade ? (
            <p className="mt-1 truncate pl-7 text-[9px] text-white/30">
              {operador.atividade}
            </p>
          ) : null}
        </div>

        {operador.statusOperacional ? (
          <span
            className={cn(
              'shrink-0 rounded px-1.5 py-px text-[8px] font-semibold uppercase',
              STATUS_OPERACIONAL_STYLES[operador.statusOperacional],
            )}
          >
            {STATUS_OPERACIONAL_LABELS[operador.statusOperacional]}
          </span>
        ) : null}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[8px] uppercase tracking-wide text-white/30">Carros</p>
          <p className="text-xs font-bold tabular-nums text-white">{operador.carros}</p>
        </div>
        <div>
          <p className="text-[8px] uppercase tracking-wide text-white/30">Tempo médio</p>
          <p className="text-xs font-bold tabular-nums text-white">
            {formatarTempoMedio(operador.tempoMedioMin)}
          </p>
        </div>
        <div>
          <p className="text-[8px] uppercase tracking-wide text-white/30">Volume</p>
          <p className="text-xs font-bold tabular-nums text-white">
            {operador.volumeUn.toLocaleString('pt-BR')} UN
          </p>
        </div>
      </div>

      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

export function RecebimentoProdutividadePanel({
  produtividade,
  className,
  compact = false,
}: {
  produtividade: ProdutividadeEquipePainel;
  className?: string;
  compact?: boolean;
}) {
  const maxCarros = Math.max(
    ...produtividade.operadores.map((op) => op.carros),
    1,
  );
  const limite = compact ? 6 : 10;
  const operadoresVisiveis = produtividade.operadores.slice(0, limite);
  const restantes = produtividade.operadores.length - operadoresVisiveis.length;

  return (
    <DashboardChartPanel
      titulo="Produtividade da Equipe"
      descricao="Ranking por carros finalizados no período"
      icon={BarChart3}
      className={cn('min-h-0', className)}
      bodyClassName={cn('flex min-h-0 flex-col gap-2', compact ? 'p-2' : 'p-3')}
    >
      <div className="grid shrink-0 grid-cols-3 gap-2">
        <KpiChip
          label="Utilização"
          value={`${produtividade.taxaUtilizacao}%`}
          icon={Users}
        />
        <KpiChip
          label="Tempo médio"
          value={formatarTempoMedio(produtividade.tempoMedioGlobalMin)}
          icon={Clock}
        />
        <KpiChip
          label="Média carros/op."
          value={String(produtividade.mediaCarrosPorOperador)}
          icon={Truck}
        />
      </div>

      {operadoresVisiveis.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <Users className="size-8 text-white/15" aria-hidden />
          <p className="text-xs text-white/50">
            Nenhum recebimento finalizado no período para montar o ranking.
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {operadoresVisiveis.map((operador, index) => (
            <OperadorRankingItem
              key={operador.funcionarioId}
              posicao={index + 1}
              operador={operador}
              maxCarros={maxCarros}
              compact={compact}
            />
          ))}
        </ul>
      )}

      {restantes > 0 ? (
        <p className="shrink-0 text-center text-[10px] text-white/30">
          +{restantes} operador{restantes > 1 ? 'es' : ''} no ranking
        </p>
      ) : null}
    </DashboardChartPanel>
  );
}
