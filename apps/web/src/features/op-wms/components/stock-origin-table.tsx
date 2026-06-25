'use client';

import { cn } from '@lilog/ui';

import type { StockOrigin } from '@/features/op-wms/types/op-wms.schema';
import { STOCK_ORIGIN_STATUS_LABELS } from '@/features/op-wms/types/op-wms.schema';

type StockOriginTableProps = {
  origins: StockOrigin[];
  selectedAddress: string;
  onSelect: (address: string) => void;
  compact?: boolean;
};

function StatusBadge({
  status,
  compact,
}: {
  status: StockOrigin['status'];
  compact?: boolean;
}) {
  const isDisponivel = status === 'disponivel';
  return (
    <span
      className={cn(
        'rounded-sm border font-bold uppercase',
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]',
        isDisponivel
          ? 'border-accent/30 bg-accent/20 text-accent'
          : 'border-destructive/30 bg-destructive/20 text-destructive',
      )}
    >
      {STOCK_ORIGIN_STATUS_LABELS[status]}
    </span>
  );
}

export function StockOriginTable({
  origins,
  selectedAddress,
  onSelect,
  compact = false,
}: StockOriginTableProps) {
  const cellPad = compact ? 'px-3 py-1.5' : 'px-6 py-2';
  const headPad = compact ? 'px-3 py-2' : 'px-6 py-4';

  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest">
      <table className="w-full border-collapse text-left">
        <thead className="border-b border-outline-variant bg-surface-low">
          <tr className="text-caption font-bold uppercase text-muted-foreground">
            <th className={headPad}>Origem</th>
            <th className={headPad}>Lote</th>
            <th className={headPad}>Qtd</th>
            <th className={headPad}>Status</th>
            <th className={cn(headPad, 'text-right w-10')} aria-label="Selecionar" />
          </tr>
        </thead>
        <tbody className={compact ? 'text-caption' : 'text-body-md'}>
          {origins.map((origin) => {
            const isSelected = selectedAddress === origin.address;
            return (
              <tr
                key={origin.id}
                className={cn(
                  'cursor-pointer border-b border-outline-variant/30 transition-colors hover:bg-primary/5',
                  isSelected && 'bg-primary/5',
                )}
                onClick={() => onSelect(origin.address)}
              >
                <td
                  className={cn(
                    cellPad,
                    'font-bold',
                    isSelected ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {origin.address}
                </td>
                <td className={cn(cellPad, 'font-mono')}>{origin.lotId}</td>
                <td className={cellPad}>{origin.quantityLabel}</td>
                <td className={cellPad}>
                  <StatusBadge status={origin.status} compact={compact} />
                </td>
                <td className={cn(cellPad, 'text-right')}>
                  <input
                    type="radio"
                    name="origin"
                    checked={isSelected}
                    onChange={() => onSelect(origin.address)}
                    className={cn(
                      'border-outline text-primary focus:ring-primary',
                      compact ? 'h-3.5 w-3.5' : 'h-5 w-5',
                    )}
                    aria-label={`Selecionar ${origin.address}`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
