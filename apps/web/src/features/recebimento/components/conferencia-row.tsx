'use client';

import { memo } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

import { cn } from '@lilog/ui';

import { compactTableCellClassName } from '@/components/ui/compact-table-classes';
import { ConferenciaAvariaExpand } from '@/features/recebimento/components/conferencia-avaria-expand';

import type {
  ConferenciaItem,
  ConferenciaStatus,
} from '@/features/recebimento/types/recebimento-detalhe.schema';

const LABEL_STATUS: Record<ConferenciaStatus, string> = {
  concluido: 'OK',
  faltante: 'Faltante',
  sobra: 'Sobra',
};

const COL_SPAN = 9;

type ConferenciaRowProps = {
  item: ConferenciaItem;
  isExpanded: boolean;
  onToggleExpand: (itemId: string) => void;
};

export const ConferenciaRow = memo(function ConferenciaRow({
  item,
  isExpanded,
  onToggleExpand,
}: ConferenciaRowProps) {
  const formato = Intl.NumberFormat('pt-BR');
  const divergence = item.qtdFisica - item.qtdXml;
  const temDivergencia = divergence !== 0;
  const qtdAvarias = item.avarias.length;
  const temAvaria = qtdAvarias > 0;
  const labelAvarias =
    qtdAvarias === 1 ? '1 avaria' : `${qtdAvarias} avarias`;
  const qtdAvariada = item.avarias.reduce(
    (acc, avaria) => ({
      caixas: acc.caixas + avaria.quantidadeCaixas,
      unidades: acc.unidades + avaria.quantidadeUnidades,
    }),
    { caixas: 0, unidades: 0 },
  );

  let divergenciaClasse =
    divergence === 0
      ? 'text-status-active'
      : divergence < 0
        ? 'text-destructive'
        : 'text-secondary';

  const textoDivergencia =
    divergence > 0
      ? `+${formato.format(divergence)}`
      : formato.format(divergence);

  const badgeStatus = cn(
    'inline-flex rounded px-1.5 py-px text-[9px] font-semibold',
    item.status === 'concluido' &&
      'bg-status-active/10 text-status-active',
    item.status === 'faltante' &&
      'bg-destructive/10 text-destructive',
    item.status === 'sobra' &&
      'bg-secondary/15 text-secondary-foreground',
  );

  const rowBg =
    temDivergencia && item.status !== 'concluido'
      ? 'bg-destructive/[0.04]'
      : temAvaria
        ? 'bg-destructive/[0.03]'
        : undefined;

  return (
    <>
      <tr
        role="row"
        className={cn('transition-colors hover:bg-muted/30', rowBg)}
      >
        <td className={cn(compactTableCellClassName, 'w-7 pl-2')}>
          {temAvaria ? (
            <button
              type="button"
              onClick={() => onToggleExpand(item.id)}
              className="flex items-center gap-0.5 rounded p-0.5 text-destructive transition-colors hover:bg-destructive/10"
              aria-expanded={isExpanded}
              aria-label={
                isExpanded
                  ? `Recolher ${labelAvarias}`
                  : `Ver ${labelAvarias}`
              }
            >
              <AlertTriangle className="size-3 shrink-0" aria-hidden />
              {isExpanded ? (
                <ChevronDown className="size-3 shrink-0" aria-hidden />
              ) : (
                <ChevronRight className="size-3 shrink-0" aria-hidden />
              )}
            </button>
          ) : null}
        </td>
        <td
          className={cn(
            compactTableCellClassName,
            'max-w-[120px] font-mono text-[10px] text-muted-foreground',
          )}
          title={item.sku}
        >
          <span className="line-clamp-2 break-all">{item.sku}</span>
        </td>
        <td
          className={cn(compactTableCellClassName, 'max-w-[160px]')}
          title={item.produto}
        >
          <span className="line-clamp-2 text-xs font-medium text-foreground">
            {item.produto}
          </span>
        </td>
        <td
          className={cn(
            compactTableCellClassName,
            'max-w-[80px] text-[10px] text-muted-foreground',
          )}
          title={item.lote}
        >
          <span className="line-clamp-1">{item.lote}</span>
        </td>
        <td
          className={cn(
            compactTableCellClassName,
            'text-center text-[10px] tabular-nums',
            temAvaria
              ? 'font-semibold text-destructive'
              : 'text-muted-foreground',
          )}
          title={
            temAvaria
              ? `${formato.format(qtdAvariada.caixas)} caixas · ${formato.format(qtdAvariada.unidades)} unidades avariadas`
              : undefined
          }
        >
          {temAvaria ? (
            <span className="inline-flex flex-col leading-tight">
              {qtdAvariada.caixas > 0 ? (
                <span>{formato.format(qtdAvariada.caixas)} cx</span>
              ) : null}
              {qtdAvariada.unidades > 0 ? (
                <span>{formato.format(qtdAvariada.unidades)} un</span>
              ) : null}
              {qtdAvariada.caixas === 0 && qtdAvariada.unidades === 0 ? (
                <span>—</span>
              ) : null}
            </span>
          ) : (
            '—'
          )}
        </td>
        <td
          className={cn(
            compactTableCellClassName,
            'text-center font-medium tabular-nums text-foreground',
          )}
        >
          {formato.format(item.qtdXml)}
        </td>
        <td
          className={cn(
            compactTableCellClassName,
            'text-center font-medium tabular-nums text-foreground',
          )}
        >
          {formato.format(item.qtdFisica)}
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
        <td className={compactTableCellClassName}>
          <span className={badgeStatus}>{LABEL_STATUS[item.status]}</span>
        </td>
      </tr>

      {temAvaria && isExpanded ? (
        <tr className="bg-destructive/[0.03]">
          <td className="px-2 py-2" colSpan={COL_SPAN}>
            <div className="border-l-2 border-destructive/30 pl-3">
              <ConferenciaAvariaExpand item={item} />
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
});
