'use client';

import { ChevronDown, ChevronUp, History } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { EstoqueStatusBadge } from '@/features/estoque/components/estoque-status-badge';
import { SaldoCell } from '@/features/estoque/components/saldo-cell';
import type { EstoqueLoteAgrupadoItem } from '@/features/estoque/types/estoque-gestao.schema';

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

type SaldoLoteRowProps = {
  item: EstoqueLoteAgrupadoItem;
  expandido: boolean;
  nested?: boolean;
  onToggleExpandido: () => void;
  onVerHistorico?: (item: EstoqueLoteAgrupadoItem) => void;
};

export function buildLoteKey(item: Pick<EstoqueLoteAgrupadoItem, 'produtoId' | 'lote'>) {
  return `${item.produtoId}-${item.lote}`;
}

export function SaldoLoteRow({
  item,
  expandido,
  nested = false,
  onToggleExpandido,
  onVerHistorico,
}: SaldoLoteRowProps) {
  const statusSaldo =
    item.saldoBloqueado > 0 && item.saldoFisico === 0 ? 'bloqueado' : 'liberado';

  return (
    <tr
      className={cn(
        compactTableRowClassName,
        nested && 'border-l-2 border-l-primary/30 bg-surface-low/50',
        !nested && item.vencimentoProximo && 'bg-amber-500/[0.04]',
        !nested && item.saldoDisponivel <= 0 && 'opacity-75',
        expandido && 'bg-surface-highest/20',
      )}
    >
      <td className={cn(compactTableCellClassName, 'w-10', nested && 'pl-6')}>
        <button
          type="button"
          onClick={onToggleExpandido}
          aria-label={
            expandido
              ? `Recolher posições do lote ${item.lote || 'sem lote'}`
              : `Expandir posições do lote ${item.lote || 'sem lote'}`
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

      <td className={cn(compactTableCellClassName, 'min-w-[200px] align-middle', nested && 'pl-2')}>
        {nested ? (
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-secondary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-secondary">
              Lote
            </span>
            <span className="font-mono text-xs font-semibold text-foreground">
              {item.lote || '—'}
            </span>
            {item.vencimentoProximo ? (
              <EstoqueStatusBadge variant="vencimento" compact />
            ) : null}
          </div>
        ) : (
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
        )}
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden min-w-[72px] sm:table-cell',
        )}
      >
        <span className="font-mono text-[11px] font-semibold text-foreground">
          {nested ? '—' : item.produtoGrupo || '—'}
        </span>
      </td>

      <td className={cn(compactTableCellClassName, 'min-w-[120px]')}>
        {nested ? (
          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">
              Validade:{' '}
              <span
                className={cn(
                  'font-medium',
                  item.vencimentoProximo
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-foreground',
                )}
              >
                {item.validadeMaisProxima
                  ? df.format(new Date(item.validadeMaisProxima))
                  : '—'}
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {item.posicoes} {item.posicoes === 1 ? 'posição' : 'posições'}
            </p>
          </div>
        ) : (
          <span className="font-mono text-[11px] md:min-w-[88px]">
            {item.lote || '—'}
          </span>
        )}
      </td>

      {!nested ? (
        <>
          <td className={cn(compactTableCellClassName, 'hidden min-w-[88px] lg:table-cell')}>
            <span
              className={cn(
                'text-[11px] font-medium',
                item.vencimentoProximo
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-foreground',
              )}
            >
              {item.validadeMaisProxima
                ? df.format(new Date(item.validadeMaisProxima))
                : '—'}
            </span>
          </td>
        </>
      ) : null}

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
          aria-label={`Ver histórico do lote ${item.lote || 'sem lote'} de ${item.produtoDescricao}`}
          onClick={() => onVerHistorico?.(item)}
        >
          <History className="size-3.5" aria-hidden />
        </Button>
      </td>
    </tr>
  );
}
