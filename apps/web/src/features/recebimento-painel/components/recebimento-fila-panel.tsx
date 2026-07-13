'use client';

import {
  AlertTriangle,
  Clock,
  Dock,
  Package,
  Truck,
  User,
  Users,
  Zap,
} from 'lucide-react';

import { cn } from '@lilog/ui';

import { DashboardChartPanel } from '@/features/dashboard-operacional/components/dashboard-charts';
import { RecebimentoStatusBadge } from '@/features/recebimento/components/recebimento-status-badge';
import type { FilaRecebimentoPainel } from '@/features/recebimento-painel/types/recebimento-painel.schema';
import type { RecebimentoStatus } from '@/features/recebimento/types/recebimento-lista.schema';

function formatHorario(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const STATUS_ACCENT: Record<
  RecebimentoStatus,
  { border: string; glow?: string }
> = {
  agendado: { border: 'border-l-white/20' },
  aguardando: { border: 'border-l-amber-500/60' },
  liberado_para_conferencia: { border: 'border-l-secondary/70' },
  em_conferencia: {
    border: 'border-l-tertiary',
    glow: 'shadow-[inset_0_0_20px_hsl(var(--tertiary)/0.08)]',
  },
  impedido: {
    border: 'border-l-orange-500/70',
    glow: 'shadow-[inset_0_0_20px_rgba(249,115,22,0.08)]',
  },
  conferido: { border: 'border-l-amber-500/50' },
  finalizado: { border: 'border-l-primary/40' },
  cancelado: { border: 'border-l-destructive/40' },
};

const EMPRESA_CHIP_COLORS = [
  'bg-primary/15 text-primary ring-primary/20',
  'bg-tertiary/15 text-tertiary ring-tertiary/20',
  'bg-sky-500/15 text-sky-300 ring-sky-500/20',
  'bg-amber-500/15 text-amber-300 ring-amber-500/20',
] as const;

function EmpresaChips({ empresas }: { empresas: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {empresas.map((empresa, index) => (
        <span
          key={empresa}
          className={cn(
            'rounded-md px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset',
            EMPRESA_CHIP_COLORS[index % EMPRESA_CHIP_COLORS.length],
          )}
        >
          {empresa}
        </span>
      ))}
    </div>
  );
}

function FilaVeiculoCard({
  item,
  posicao,
  compact,
}: {
  item: FilaRecebimentoPainel;
  posicao: number;
  compact: boolean;
}) {
  const accent = STATUS_ACCENT[item.situacao];
  const emConferencia = item.situacao === 'em_conferencia';
  const impedido = item.situacao === 'impedido';

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-r from-white/[0.05] to-transparent transition-colors',
        'border-l-[3px]',
        accent.border,
        accent.glow,
        item.isAtrasado && 'from-destructive/[0.06] ring-1 ring-destructive/20',
        item.grauPrioridade === 'urgente' && 'ring-1 ring-destructive/30',
        compact ? 'p-2' : 'p-3',
      )}
    >
      {emConferencia ? (
        <span
          className="pointer-events-none absolute right-3 top-3 size-2 animate-pulse rounded-full bg-tertiary shadow-[0_0_8px_hsl(var(--tertiary))]"
          aria-hidden
        />
      ) : impedido ? (
        <span
          className="pointer-events-none absolute right-3 top-3 size-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
          aria-hidden
        />
      ) : null}

      <div
        className={cn(
          'flex items-start gap-3',
          compact ? 'gap-2' : 'gap-4',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 flex-col items-center justify-center rounded-lg bg-black/30 text-center',
            compact ? 'size-9' : 'size-11',
          )}
        >
          <span className="text-[8px] font-medium uppercase tracking-wider text-white/30">
            #{posicao}
          </span>
          <Truck
            className={cn(
              'text-white/50',
              compact ? 'size-3.5' : 'size-4',
              emConferencia && 'text-tertiary',
              impedido && 'text-orange-400',
            )}
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={cn(
                'font-mono font-bold tracking-wide text-white',
                compact ? 'text-sm' : 'text-base',
              )}
            >
              {item.placa}
            </h4>

            {item.grauPrioridade === 'urgente' ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-destructive">
                <Zap className="size-2.5" aria-hidden />
                Urgente
              </span>
            ) : item.grauPrioridade === 'alto' ? (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-400">
                Prioritário
              </span>
            ) : null}

            {item.isAtrasado ? (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-destructive">
                <AlertTriangle className="size-3" aria-hidden />
                Atrasado
              </span>
            ) : null}

            <div className="ml-auto shrink-0">
              <RecebimentoStatusBadge status={item.situacao} compact onDark />
            </div>
          </div>

          {!compact ? (
            <p className="mt-0.5 truncate text-[11px] text-white/45">
              {item.transportadoraNome}
            </p>
          ) : null}

          <div
            className={cn(
              'mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5',
              compact && 'mt-1.5 gap-x-3',
            )}
          >
            <EmpresaChips empresas={item.empresas} />

            <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/50">
              {item.docaCodigo ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono font-semibold text-white/75">
                  <Dock className="size-3 text-secondary" aria-hidden />
                  {item.docaCodigo}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-white/30">
                  <Dock className="size-3" aria-hidden />
                  Sem doca
                </span>
              )}

              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="size-3" aria-hidden />
                {formatHorario(item.horarioPrevisto)}
              </span>

              {!compact ? (
                <span className="inline-flex items-center gap-1">
                  <Package className="size-3" aria-hidden />
                  {item.volumeUn.toLocaleString('pt-BR')} UN
                </span>
              ) : null}

              {item.conferenteNome ? (
                <span className="inline-flex items-center gap-1 text-white/60">
                  <User className="size-3 text-tertiary" aria-hidden />
                  {item.conferenteNome}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function RecebimentoFilaPanel({
  fila,
  className,
  compact = false,
}: {
  fila: FilaRecebimentoPainel[];
  className?: string;
  compact?: boolean;
}) {
  const items = compact ? fila.slice(0, 5) : fila;
  const emConferencia = fila.filter((item) => item.situacao === 'em_conferencia').length;
  const aguardando = fila.filter(
    (item) =>
      item.situacao === 'liberado_para_conferencia' ||
      item.situacao === 'aguardando',
  ).length;

  return (
    <DashboardChartPanel
      titulo="Fila ao Vivo"
      descricao={`${fila.length} na fila · ${emConferencia} conferindo · ${aguardando} aguardando`}
      icon={Users}
      className={cn('min-h-0', className)}
      bodyClassName={cn('min-h-0 overflow-hidden', compact ? 'p-2' : 'p-3')}
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-12 text-center">
          <Truck className="size-8 text-white/20" aria-hidden />
          <p className="mt-2 text-sm text-white/40">Nenhum veículo na fila</p>
        </div>
      ) : (
        <ul
          className={cn(
            'grid gap-2',
            compact ? 'gap-1.5' : 'gap-2.5 sm:grid-cols-1 lg:grid-cols-2',
          )}
        >
          {items.map((item, index) => (
            <li key={item.preRecebimentoId}>
              <FilaVeiculoCard
                item={item}
                posicao={index + 1}
                compact={compact}
              />
            </li>
          ))}
        </ul>
      )}
    </DashboardChartPanel>
  );
}
