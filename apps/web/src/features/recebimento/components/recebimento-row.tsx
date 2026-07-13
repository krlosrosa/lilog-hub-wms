'use client';

import { Button, cn } from '@lilog/ui';
import {
  Clock,
  Dock,
  Eye,
  Pencil,
  Trash2,
  Truck,
} from 'lucide-react';
import Link from 'next/link';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { RecebimentoStatusBadge } from '@/features/recebimento/components/recebimento-status-badge';
import type {
  RecebimentoListaItem,
} from '@/features/recebimento/types/recebimento-lista.schema';

function EmpresaChips({
  codigos,
}: {
  codigos: readonly string[];
}) {
  return (
    <div className="flex flex-wrap justify-end gap-0.5">
      {codigos.map((c, idx) => {
        const palette =
          idx % 3 === 0
            ? 'bg-primary/15 text-primary'
            : idx % 3 === 1
              ? 'bg-tertiary/15 text-tertiary'
              : 'bg-secondary/15 text-secondary';
        return (
          <span
            key={`${c}-${idx}`}
            className={cn(
              'rounded px-1.5 py-px text-[9px] font-bold',
              palette,
            )}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
}

type RecebimentoRowProps = {
  recebimento: RecebimentoListaItem;
  /** Quando definido, ações navegam ao detalhe. */
  detailHref?: string;
  onSelecionar?: (r: RecebimentoListaItem) => void;
  selecionado?: boolean;
  selecionavel?: boolean;
  onEditar?: (r: RecebimentoListaItem) => void;
  onVisualizar?: (r: RecebimentoListaItem) => void;
  onExcluir?: (r: RecebimentoListaItem) => void;
};

export function RecebimentoRow({
  recebimento,
  detailHref,
  onSelecionar,
  selecionado,
  selecionavel = false,
  onEditar,
  onVisualizar,
  onExcluir,
}: RecebimentoRowProps) {
  const { horario, isAtrasado, status } = recebimento;
  const ehFinalizado = status === 'finalizado' || status === 'cancelado';
  const linhaDestaque =
    status === 'em_conferencia'
      ? 'bg-primary-container/30'
      : status === 'impedido'
        ? 'bg-orange-500/10'
        : '';
  const baixaOpacidade = ehFinalizado ? 'opacity-70' : '';

  const textoHorarioClasses = cn(
    'inline-flex flex-wrap items-center gap-1',
    (status === 'agendado' || status === 'liberado_para_conferencia') &&
      isAtrasado &&
      'text-destructive',
    status === 'em_conferencia' && 'text-primary',
    status === 'impedido' && 'text-orange-600 dark:text-orange-400',
    !(
      (status === 'agendado' || status === 'liberado_para_conferencia') &&
      isAtrasado
    ) &&
      status !== 'em_conferencia' &&
      'text-muted-foreground',
    ehFinalizado && !isAtrasado && 'text-muted-foreground',
  );

  return (
    <tr
      tabIndex={0}
      role="row"
      onClick={() => {
        if (selecionavel) {
          onSelecionar?.(recebimento);
        }
      }}
      className={cn(
        compactTableRowClassName,
        linhaDestaque,
        baixaOpacidade,
        selecionado && !linhaDestaque && 'bg-primary-container/25',
      )}
    >
      <td className={cn(compactTableCellClassName, 'w-8')}>
        {selecionavel ? (
          <input
            type="checkbox"
            checked={selecionado}
            aria-label={`Selecionar recebimento ${recebimento.placa}`}
            onChange={() => onSelecionar?.(recebimento)}
            onClick={(event: React.MouseEvent<HTMLInputElement>) => {
              event.stopPropagation();
            }}
            className="size-3.5 rounded border-outline-variant text-primary focus:ring-primary"
          />
        ) : null}
      </td>

      <td className={compactTableCellClassName}>
        <div className="flex items-center gap-1.5">
          <div
            className="flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-highest text-muted-foreground"
            aria-hidden
          >
            <Truck className="size-3" />
          </div>
          <div className="min-w-0">
            {detailHref ? (
              <Link
                href={detailHref}
                className="block truncate font-mono text-[11px] font-semibold uppercase tracking-wide text-foreground underline-offset-2 hover:text-primary hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {recebimento.placa}
              </Link>
            ) : (
              <p className="truncate font-mono text-[11px] font-semibold uppercase tracking-wide text-foreground">
                {recebimento.placa}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className={cn(compactTableCellClassName, 'hidden max-w-[120px] truncate font-mono text-[10px] text-muted-foreground sm:table-cell')}>
        {recebimento.transportador}
      </td>

      <td className={compactTableCellClassName}>
        <div className={textoHorarioClasses}>
          {(status === 'agendado' || status === 'liberado_para_conferencia') &&
          isAtrasado ? (
            <>
              <Clock className="size-3 shrink-0" aria-hidden />
              <span className="text-[11px] font-bold">{horario}</span>
              <span className="rounded bg-destructive/15 px-1 text-[8px] font-bold uppercase">
                Atrasado
              </span>
            </>
          ) : status === 'em_conferencia' ? (
            <>
              <Dock className="size-3 shrink-0" aria-hidden />
              <span className="text-[11px] font-bold">{horario}</span>
            </>
          ) : !ehFinalizado ? (
            <>
              <Clock className="size-3 shrink-0" aria-hidden />
              <span className="text-[11px] font-bold text-foreground">{horario}</span>
            </>
          ) : (
            <span className="text-[11px] font-bold text-foreground">{horario}</span>
          )}
        </div>
      </td>

      <td className={cn(compactTableCellClassName, 'text-right')}>
        <EmpresaChips codigos={recebimento.empresas} />
      </td>

      <td className={compactTableCellClassName}>
        <RecebimentoStatusBadge status={recebimento.status} compact />
      </td>

      <td className={cn(compactTableCellClassName, 'text-right')}>
        <div className="flex justify-end gap-px">
          {!ehFinalizado ? (
            <>
              {detailHref ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Abrir recebimento ${recebimento.placa}`}
                  className="size-6 rounded-md text-muted-foreground hover:bg-surface-highest hover:text-primary"
                  asChild
                >
                  <Link
                    href={detailHref}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Pencil className="size-3" />
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Editar recebimento ${recebimento.placa}`}
                  className="size-6 rounded-md text-muted-foreground hover:bg-surface-highest hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditar?.(recebimento);
                  }}
                >
                  <Pencil className="size-3" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Excluir recebimento ${recebimento.placa}`}
                className="size-6 rounded-md text-muted-foreground hover:bg-surface-highest hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onExcluir?.(recebimento);
                }}
              >
                <Trash2 className="size-3" aria-hidden />
              </Button>
            </>
          ) : detailHref ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Ver detalhes ${recebimento.placa}`}
              className="size-6 rounded-md text-muted-foreground hover:bg-surface-highest hover:text-primary"
              asChild
            >
              <Link
                href={detailHref}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Eye className="size-3" />
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Ver recebimento ${recebimento.placa}`}
              className="size-6 rounded-md text-muted-foreground hover:bg-surface-highest hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onVisualizar?.(recebimento);
              }}
            >
              <Eye className="size-3" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
