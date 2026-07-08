'use client';

import Link from 'next/link';

import { History } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { EstoqueStatusBadge } from '@/features/estoque/components/estoque-status-badge';
import { SaldoCell } from '@/features/estoque/components/saldo-cell';
import type { EstoqueListaItem } from '@/features/estoque/types/estoque-gestao.schema';

const df = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dtf = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

type SaldoDisponibilidadeRowProps = {
  item: EstoqueListaItem;
  onVerHistorico?: (item: EstoqueListaItem) => void;
};

export function SaldoDisponibilidadeRow({
  item,
  onVerHistorico,
}: SaldoDisponibilidadeRowProps) {
  const statusSaldo =
    item.saldoBloqueado > 0 && item.saldoFisico === 0 ? 'bloqueado' : 'liberado';

  return (
    <tr
      className={cn(
        compactTableRowClassName,
        item.vencimentoProximo && 'bg-amber-500/[0.04]',
        item.saldoDisponivel <= 0 && 'opacity-75',
      )}
    >
      <td className={cn(compactTableCellClassName, 'min-w-[160px]')}>
        <Link
          href={`/enderecos/${item.enderecoId}`}
          className="group block min-w-0"
        >
          <p className="truncate font-mono text-[12px] font-bold tracking-tight text-primary group-hover:underline">
            {item.enderecoMascarado}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {item.depositoCodigo} · {item.depositoNome}
          </p>
        </Link>
      </td>

      <td className={cn(compactTableCellClassName, 'min-w-[180px] align-middle')}>
        <div className="flex items-center gap-1.5">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-foreground">
              {item.produtoDescricao}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              <span className="font-mono font-semibold text-foreground">
                {item.produtoId}
              </span>
              {' · '}
              SKU {item.produtoSku}
            </p>
          </div>
          {item.vencimentoProximo && (
            <EstoqueStatusBadge variant="vencimento" compact />
          )}
        </div>
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden min-w-[72px] sm:table-cell',
        )}
      >
        <span className="font-mono text-[11px] font-semibold text-foreground">
          {item.produtoGrupo || '—'}
        </span>
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden min-w-[72px] font-mono text-[11px] md:table-cell',
        )}
      >
        {item.lote || '—'}
      </td>

      <td className={cn(compactTableCellClassName, 'hidden min-w-[88px] lg:table-cell')}>
        <span
          className={cn(
            'text-[11px] font-medium',
            item.vencimentoProximo
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-foreground',
          )}
        >
          {item.validade ? df.format(new Date(item.validade)) : '—'}
        </span>
      </td>

      <td className={cn(compactTableCellClassName, 'text-right')}>
        <SaldoCell value={item.saldoFisico} />
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden text-right xl:table-cell',
        )}
      >
        {item.pesoLiquidoTotalKg != null ? (
          <SaldoCell value={item.pesoLiquidoTotalKg} tone="muted" />
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        )}
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden text-right sm:table-cell',
        )}
      >
        <SaldoCell value={item.saldoReservado} tone="warning" />
      </td>

      <td className={cn(compactTableCellClassName, 'text-right')}>
        <SaldoCell value={item.saldoDisponivel} tone="positive" className="text-xs" />
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden text-right xl:table-cell',
        )}
      >
        <SaldoCell value={item.saldoBloqueado} tone="critical" />
      </td>

      <td className={compactTableCellClassName}>
        <EstoqueStatusBadge variant="status" value={statusSaldo} compact />
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden min-w-[108px] text-[10px] tabular-nums text-muted-foreground 2xl:table-cell',
        )}
      >
        {dtf.format(new Date(item.updatedAt))}
      </td>

      <td className={cn(compactTableCellClassName, 'w-10 text-right')}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-primary"
          aria-label={`Ver histórico de ${item.produtoDescricao}`}
          onClick={() => onVerHistorico?.(item)}
        >
          <History className="size-3.5" aria-hidden />
        </Button>
      </td>
    </tr>
  );
}
