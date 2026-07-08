'use client';

import { ChevronDown, ChevronUp, History } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { EstoqueStatusBadge } from '@/features/estoque/components/estoque-status-badge';
import { SaldoCell } from '@/features/estoque/components/saldo-cell';
import type { EstoqueProdutoAgrupadoItem } from '@/features/estoque/types/estoque-gestao.schema';

const dtf = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

type SaldoProdutoRowProps = {
  item: EstoqueProdutoAgrupadoItem;
  expandido: boolean;
  onToggleExpandido: () => void;
  onVerHistorico?: (item: EstoqueProdutoAgrupadoItem) => void;
};

export function buildProdutoKey(item: Pick<EstoqueProdutoAgrupadoItem, 'produtoId'>) {
  return item.produtoId;
}

export function SaldoProdutoRow({
  item,
  expandido,
  onToggleExpandido,
  onVerHistorico,
}: SaldoProdutoRowProps) {
  const statusSaldo =
    item.saldoBloqueado > 0 && item.saldoFisico === 0 ? 'bloqueado' : 'liberado';

  return (
    <tr
      className={cn(
        compactTableRowClassName,
        'bg-surface-high/40',
        item.vencimentoProximo && 'bg-amber-500/[0.04]',
        item.saldoDisponivel <= 0 && 'opacity-80',
        expandido && 'bg-primary/[0.04] ring-1 ring-inset ring-primary/15',
      )}
    >
      <td className={cn(compactTableCellClassName, 'w-10')}>
        <button
          type="button"
          onClick={onToggleExpandido}
          aria-label={
            expandido
              ? `Recolher lotes de ${item.produtoDescricao}`
              : `Expandir lotes de ${item.produtoDescricao}`
          }
          aria-expanded={expandido}
          className={cn(
            'flex size-7 items-center justify-center rounded-md border border-outline-variant/60',
            'text-muted-foreground transition-all hover:border-primary/40 hover:bg-surface-highest hover:text-primary',
            expandido && 'border-primary/30 bg-primary/10 text-primary',
          )}
        >
          {expandido ? (
            <ChevronUp className="size-3.5" aria-hidden />
          ) : (
            <ChevronDown className="size-3.5" aria-hidden />
          )}
        </button>
      </td>

      <td className={cn(compactTableCellClassName, 'min-w-[200px] align-middle')}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
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
          {item.vencimentoProximo ? (
            <EstoqueStatusBadge variant="vencimento" compact />
          ) : null}
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

      <td className={cn(compactTableCellClassName, 'min-w-[120px]')}>
        <div className="flex flex-wrap gap-1">
          <span className="rounded-full border border-outline-variant bg-surface-highest px-2 py-0.5 text-[10px] font-medium text-foreground">
            {item.totalLotes} {item.totalLotes === 1 ? 'lote' : 'lotes'}
          </span>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {item.posicoes} {item.posicoes === 1 ? 'posição' : 'posições'}
          </span>
        </div>
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
