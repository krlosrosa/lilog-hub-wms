'use client';

import { Check, Loader2, RefreshCw, X } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { accentSubtleBadgePlainClassName } from '@/lib/semantic-badge-classes';
import type { DivergenciaItem } from '@/features/inventario/types/inventario-detalhe.schema';
import {
  DIVERGENCIA_STATUS_LABELS,
  DIVERGENCIA_TIPO_LABELS,
  RECONTAGEM_DEMANDA_STATUS_LABELS,
} from '@/features/inventario/types/inventario-detalhe.schema';

export type DivergenciaRowProps = {
  item: DivergenciaItem;
  processando?: boolean;
  onAprovar?: (id: string) => void;
  onReprovar?: (id: string) => void;
  onRecontar?: (id: string) => void;
};

function statusBadgeClass(status: DivergenciaItem['status']) {
  switch (status) {
    case 'pendente':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
    case 'aprovada':
      return 'bg-primary/15 text-primary';
    case 'aplicada':
      return 'bg-accent/15 text-accent';
    case 'reprovada':
      return 'bg-destructive/15 text-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function isRecontagemEmAndamento(item: DivergenciaItem): boolean {
  const status = item.recontagemAtual?.demandaStatus;
  return status === 'aguardando_inicio' || status === 'em_andamento';
}

export function DivergenciaRow({
  item,
  processando = false,
  onAprovar,
  onReprovar,
  onRecontar,
}: DivergenciaRowProps) {
  const isFalta = item.tipo === 'falta' || item.tipo === 'endereco_vazio';
  const recontagemAberta = isRecontagemEmAndamento(item);
  const podeAgir = item.podeAprovar && item.status === 'pendente';
  const podeRecontar =
    item.podeRecontar && item.status === 'pendente' && !recontagemAberta;

  return (
    <tr className={compactTableRowClassName}>
      <td className={compactTableCellClassName}>
        <div className="min-w-[8rem]">
          <span className="block text-[11px] font-semibold text-foreground">
            {item.sku}
          </span>
          <span className="block truncate text-[10px] text-muted-foreground">
            {item.produtoNome}
          </span>
          {item.endereco ? (
            <span className="block truncate text-[10px] text-muted-foreground/80">
              {item.endereco}
            </span>
          ) : null}
        </div>
      </td>
      <td
        className={cn(
          compactTableCellClassName,
          'hidden sm:table-cell text-[11px] text-foreground',
        )}
      >
        {item.setor}
      </td>
      <td
        className={cn(
          compactTableCellClassName,
          'text-[11px] tabular-nums text-foreground',
        )}
      >
        {item.esperadoLabel}
      </td>
      <td
        className={cn(
          compactTableCellClassName,
          'text-[11px] tabular-nums text-foreground',
        )}
      >
        {item.encontradoLabel}
      </td>
      <td
        className={cn(
          compactTableCellClassName,
          'text-[11px] font-semibold tabular-nums',
          isFalta ? 'text-destructive' : 'text-accent',
        )}
      >
        {item.diferencaLabel}
      </td>
      <td className={cn(compactTableCellClassName, 'hidden md:table-cell')}>
        <div className="flex flex-col gap-1">
          <span
            className={cn(
              'w-fit rounded px-1.5 py-px text-[9px] font-bold uppercase',
              isFalta
                ? 'bg-destructive/15 text-destructive'
                : accentSubtleBadgePlainClassName,
            )}
          >
            {DIVERGENCIA_TIPO_LABELS[item.tipo]}
          </span>
          {item.status ? (
            <span
              className={cn(
                'w-fit rounded px-1.5 py-px text-[9px] font-bold uppercase',
                statusBadgeClass(item.status),
              )}
            >
              {DIVERGENCIA_STATUS_LABELS[item.status]}
            </span>
          ) : null}
          {recontagemAberta && item.recontagemAtual ? (
            <span className="w-fit rounded bg-primary/15 px-1.5 py-px text-[9px] font-bold uppercase text-primary">
              Recontagem ·{' '}
              {RECONTAGEM_DEMANDA_STATUS_LABELS[item.recontagemAtual.demandaStatus]}
            </span>
          ) : null}
          {recontagemAberta && item.recontagemAtual ? (
            <span className="truncate text-[9px] text-muted-foreground">
              {item.recontagemAtual.responsavelNome}
            </span>
          ) : null}
        </div>
      </td>
      <td className={cn(compactTableCellClassName, 'text-right')}>
        {podeAgir || podeRecontar ? (
          <div className="flex items-center justify-end gap-1">
            {podeRecontar ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 border-outline-variant px-2 text-[10px]"
                disabled={processando}
                onClick={() => onRecontar?.(item.id)}
              >
                <RefreshCw className="size-3" aria-hidden />
                Recontar
              </Button>
            ) : null}
            {podeAgir ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 gap-1 px-2 text-[10px]"
                  disabled={processando}
                  onClick={() => onAprovar?.(item.id)}
                >
                  {processando ? (
                    <Loader2 className="size-3 animate-spin" aria-hidden />
                  ) : (
                    <Check className="size-3" aria-hidden />
                  )}
                  Aprovar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 border-outline-variant px-2 text-[10px] text-destructive hover:text-destructive"
                  disabled={processando}
                  onClick={() => onReprovar?.(item.id)}
                >
                  <X className="size-3" aria-hidden />
                  Reprovar
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
      </td>
    </tr>
  );
}
