'use client';

import Link from 'next/link';

import { cn } from '@lilog/ui';

import { DevolucaoChegadaAction } from '@/features/devolucao/components/devolucao-chegada-action';
import {
  DevolucaoStatusBadge,
  TipoDemandaBadge,
} from '@/features/devolucao/components/devolucao-status-badge';
import type { DemandaItem } from '@/features/devolucao/types/devolucao-gestao.schema';
import { canRegistrarChegada } from '@/features/devolucao/types/devolucao-gestao.schema';

type DevolucaoDemandRowProps = {
  demanda: DemandaItem;
  className?: string;
};

function progressBarColor(status: DemandaItem['status'], progresso: number) {
  if (status === 'atrasado') return 'bg-destructive';
  if (status === 'finalizado') return 'bg-primary';
  if (status === 'aguardando-chegada') return 'bg-primary/40';
  if (progresso === 0) return 'bg-muted-foreground';
  return 'bg-tertiary';
}

export function DevolucaoDemandRow({ demanda, className }: DevolucaoDemandRowProps) {
  const aguardandoChegada = canRegistrarChegada(demanda.status);
  const isInactive =
    demanda.status === 'finalizado' ||
    (demanda.status !== 'aguardando-chegada' && demanda.progresso === 0);
  const barColor = progressBarColor(demanda.status, demanda.progresso);

  return (
    <tr
      className={cn(
        'transition-colors hover:bg-surface-highest/50',
        aguardandoChegada &&
          'border-l-2 border-l-primary bg-primary/[0.03] hover:bg-primary/[0.06]',
        className,
      )}
    >
      <td className="px-2 py-1.5">
        <span
          className={cn(
            'inline-block rounded border border-outline-variant bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground',
            isInactive && !aguardandoChegada && 'opacity-50',
            aguardandoChegada && 'border-primary/20 text-primary',
          )}
        >
          {demanda.doca}
        </span>
      </td>
      <td className={cn('px-2 py-1.5', isInactive && !aguardandoChegada && 'opacity-70')}>
        {aguardandoChegada ? (
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-foreground">
              {demanda.veiculo}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {demanda.placa}
            </span>
          </div>
        ) : (
          <Link
            href={`/devolucao/${demanda.id}`}
            className="flex flex-col hover:text-primary"
          >
            <span className="text-[11px] font-semibold text-foreground">
              {demanda.veiculo}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {demanda.placa}
            </span>
          </Link>
        )}
      </td>
      <td
        className={cn(
          'hidden max-w-[100px] truncate px-2 py-1.5 text-[11px] sm:table-cell',
          isInactive && !aguardandoChegada && 'opacity-70',
        )}
      >
        {demanda.motorista}
      </td>
      <td className={cn('px-2 py-1.5', isInactive && !aguardandoChegada && 'opacity-70')}>
        <TipoDemandaBadge tipo={demanda.tipo} compact />
      </td>
      <td className="w-24 px-2 py-1.5">
        <div
          className={cn(
            'flex items-center gap-1.5',
            demanda.status === 'atrasado' && 'text-destructive',
          )}
        >
          <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full', barColor)}
              style={{ width: `${demanda.progresso}%` }}
            />
          </div>
          <span className="font-mono text-[10px] tabular-nums">
            {demanda.progresso}%
          </span>
        </div>
      </td>
      <td
        className={cn(
          'hidden px-2 py-1.5 font-mono text-[11px] md:table-cell',
          demanda.status === 'atrasado' && 'text-destructive',
          demanda.status === 'finalizado' && 'text-muted-foreground',
        )}
      >
        {demanda.previsao}
      </td>
      <td className="px-2 py-1.5">
        <DevolucaoStatusBadge status={demanda.status} compact />
      </td>
      <td className="px-2 py-1.5">
        {aguardandoChegada ? (
          <DevolucaoChegadaAction
            demandaId={demanda.id}
            placa={demanda.placa}
            compact
          />
        ) : (
          <span className="text-[10px] text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}
