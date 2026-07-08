'use client';

import { cn } from '@lilog/ui';

import {
  compactTableCellClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import type { LoteDetalheItem } from '@/features/recebimento/types/recebimento-detalhe.schema';

type ConferenciaLoteExpandProps = {
  lotes: readonly LoteDetalheItem[];
  produto: string;
};

const HEADERS = [
  { label: 'Lote', className: 'min-w-[100px]' },
  { label: 'Contábil', className: 'w-16 text-center' },
  { label: 'Físico', className: 'w-16 text-center' },
  { label: 'Dif.', className: 'w-14 text-center' },
] as const;

function formatLoteDisplay(lote: string | null): string {
  return lote ?? '(sem lote)';
}

export function ConferenciaLoteExpand({
  lotes,
  produto,
}: ConferenciaLoteExpandProps) {
  const formato = Intl.NumberFormat('pt-BR');

  return (
    <div className="space-y-2 py-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {produto} — detalhamento por lote
      </p>

      <div className="overflow-x-auto rounded-md border border-outline-variant/50 bg-background/60">
        <table className={compactTableClassName}>
          <thead>
            <tr className={compactTableHeadRowClassName}>
              {HEADERS.map((header) => (
                <th
                  key={header.label}
                  className={compactTableHeadCellClassName(header.className)}
                  scope="col"
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lotes.map((lote, index) => {
              const divergencia = lote.qtdRecebida - lote.qtdEsperada;
              const temDivergencia = divergencia !== 0;
              const divergenciaClasse =
                divergencia === 0
                  ? 'text-status-active'
                  : divergencia < 0
                    ? 'text-destructive'
                    : 'text-secondary';
              const textoDivergencia =
                divergencia > 0
                  ? `+${formato.format(divergencia)}`
                  : formato.format(divergencia);

              return (
                <tr
                  key={`${lote.lote ?? 'sem-lote'}-${index}`}
                  className={cn(
                    'border-t border-outline-variant/30',
                    temDivergencia && divergencia < 0 && 'bg-destructive/[0.04]',
                    temDivergencia &&
                      divergencia > 0 &&
                      'bg-secondary/[0.06]',
                  )}
                >
                  <td
                    className={cn(
                      compactTableCellClassName,
                      'font-mono text-[10px] text-foreground',
                    )}
                  >
                    {formatLoteDisplay(lote.lote)}
                  </td>
                  <td
                    className={cn(
                      compactTableCellClassName,
                      'text-center tabular-nums text-foreground',
                    )}
                  >
                    {formato.format(lote.qtdEsperada)}
                  </td>
                  <td
                    className={cn(
                      compactTableCellClassName,
                      'text-center tabular-nums text-foreground',
                    )}
                  >
                    {formato.format(lote.qtdRecebida)}
                  </td>
                  <td
                    className={cn(
                      compactTableCellClassName,
                      'text-center font-semibold tabular-nums',
                      divergenciaClasse,
                    )}
                  >
                    {textoDivergencia}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
