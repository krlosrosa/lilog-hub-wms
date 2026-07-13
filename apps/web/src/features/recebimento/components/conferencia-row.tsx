'use client';

import { memo } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

import { cn } from '@lilog/ui';

import { conferenciaTableCellClassName } from '@/components/ui/compact-table-classes';
import { useDisplayConfig } from '@/features/config-operacional/hooks/use-display-config';
import { ConferenciaAvariaExpand } from '@/features/recebimento/components/conferencia-avaria-expand';
import { ConferenciaLoteExpand } from '@/features/recebimento/components/conferencia-lote-expand';

import type {
  ConferenciaItem,
  ConferenciaStatus,
} from '@/features/recebimento/types/recebimento-detalhe.schema';

const LABEL_STATUS: Record<ConferenciaStatus, string> = {
  concluido: 'OK',
  faltante: 'Faltante',
  sobra: 'Sobra',
};

const COL_SPAN = 11;
const PESO_DIVERGENCIA_TOLERANCIA = 0.001;

function formatPesoKg(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

type ConferenciaRowProps = {
  item: ConferenciaItem;
  isExpanded: boolean;
  onToggleExpand: (itemId: string) => void;
  isLoteExpanded: boolean;
  onToggleLoteExpand: (itemId: string) => void;
};

export const ConferenciaRow = memo(function ConferenciaRow({
  item,
  isExpanded,
  onToggleExpand,
  isLoteExpanded,
  onToggleLoteExpand,
}: ConferenciaRowProps) {
  const { formatQtd, formatQtdSigned } = useDisplayConfig();
  const divergence = item.qtdFisica - item.qtdXml;
  const temDivergencia = divergence !== 0;
  const qtdAvarias = item.avarias.length;
  const temAvaria = qtdAvarias > 0;
  const temLotes = item.lotesDetalhe.length > 0;
  const labelAvarias =
    qtdAvarias === 1 ? '1 avaria' : `${qtdAvarias} avarias`;
  const unidadesPorCaixa = item.unidadesPorCaixa ?? 1;
  const qtdAvariada = item.avarias.reduce(
    (acc, avaria) => ({
      caixas: acc.caixas + avaria.quantidadeCaixas,
      unidades: acc.unidades + avaria.quantidadeUnidades,
    }),
    { caixas: 0, unidades: 0 },
  );
  const qtdAvariadaTotalUnidades =
    qtdAvariada.unidades + qtdAvariada.caixas * unidadesPorCaixa;

  let divergenciaClasse =
    divergence === 0
      ? 'text-status-active'
      : divergence < 0
        ? 'text-destructive'
        : 'text-secondary';

  const textoDivergencia = formatQtdSigned(divergence, unidadesPorCaixa);

  const pesoDiff =
    item.pesoXml !== null && item.pesoFisico !== null
      ? item.pesoFisico - item.pesoXml
      : null;
  const temDivergenciaPeso =
    item.pesoVariavel &&
    pesoDiff !== null &&
    Math.abs(pesoDiff) > PESO_DIVERGENCIA_TOLERANCIA;
  const pesoDivergenciaClasse =
    pesoDiff === null || Math.abs(pesoDiff) <= PESO_DIVERGENCIA_TOLERANCIA
      ? 'text-status-active'
      : pesoDiff < 0
        ? 'text-destructive'
        : 'text-secondary';

  const badgeStatus = cn(
    'inline-flex rounded px-1.5 py-0.5 text-[11px] font-semibold',
    item.status === 'concluido' &&
      'bg-status-active/10 text-status-active',
    item.status === 'faltante' &&
      'bg-destructive/10 text-destructive',
    item.status === 'sobra' &&
      'bg-secondary/15 text-secondary-foreground',
  );

  const rowBg =
    (temDivergencia && item.status !== 'concluido') || temDivergenciaPeso
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
        <td className={cn(conferenciaTableCellClassName, 'w-7 pl-2')}>
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
            conferenciaTableCellClassName,
            'max-w-[120px] font-mono text-muted-foreground',
          )}
          title={item.sku}
        >
          <span className="line-clamp-2 break-all">{item.sku}</span>
        </td>
        <td
          className={cn(conferenciaTableCellClassName, 'max-w-[160px]')}
          title={item.produto}
        >
          <span className="line-clamp-2 font-medium text-foreground">
            {item.produto}
          </span>
        </td>
        <td
          className={cn(
            conferenciaTableCellClassName,
            'max-w-[80px] text-muted-foreground',
          )}
          title={item.lote}
        >
          {temLotes ? (
            <button
              type="button"
              onClick={() => onToggleLoteExpand(item.id)}
              className="inline-flex max-w-full items-center gap-0.5 rounded px-0.5 py-px text-left transition-colors hover:bg-muted/50 hover:text-foreground"
              aria-expanded={isLoteExpanded}
              aria-label={
                isLoteExpanded
                  ? `Recolher lotes de ${item.produto}`
                  : `Expandir lotes de ${item.produto}`
              }
            >
              <span className="line-clamp-1">{item.lote}</span>
              {isLoteExpanded ? (
                <ChevronDown className="size-3 shrink-0" aria-hidden />
              ) : (
                <ChevronRight className="size-3 shrink-0" aria-hidden />
              )}
            </button>
          ) : (
            <span className="line-clamp-1">{item.lote}</span>
          )}
        </td>
        <td
          className={cn(
            conferenciaTableCellClassName,
            'text-center tabular-nums',
            temAvaria
              ? 'font-semibold text-destructive'
              : 'text-muted-foreground',
          )}
          title={
            temAvaria
              ? `${formatQtd(qtdAvariadaTotalUnidades, unidadesPorCaixa)} (${formatQtd(qtdAvariada.caixas * unidadesPorCaixa, unidadesPorCaixa)} · ${formatQtd(qtdAvariada.unidades, unidadesPorCaixa)})`
              : undefined
          }
        >
          {temAvaria && qtdAvariadaTotalUnidades > 0
            ? formatQtd(qtdAvariadaTotalUnidades, unidadesPorCaixa)
            : '—'}
        </td>
        <td
          className={cn(
            conferenciaTableCellClassName,
            'text-center font-medium tabular-nums text-foreground',
          )}
        >
          {formatQtd(item.qtdXml, unidadesPorCaixa)}
        </td>
        <td
          className={cn(
            conferenciaTableCellClassName,
            'text-center font-medium tabular-nums text-foreground',
          )}
        >
          {formatQtd(item.qtdFisica, unidadesPorCaixa)}
        </td>
        <td
          className={cn(
            conferenciaTableCellClassName,
            'text-center font-semibold tabular-nums',
            divergenciaClasse,
          )}
        >
          {textoDivergencia}
        </td>
        <td
          className={cn(
            conferenciaTableCellClassName,
            'text-center tabular-nums',
            item.pesoVariavel && temDivergenciaPeso && pesoDivergenciaClasse,
            !item.pesoVariavel && 'text-muted-foreground',
          )}
          title={
            item.pesoVariavel
              ? 'Peso esperado conforme pré-recebimento ou cadastro do produto'
              : undefined
          }
        >
          {item.pesoVariavel && item.pesoXml !== null
            ? formatPesoKg(item.pesoXml)
            : '—'}
        </td>
        <td
          className={cn(
            conferenciaTableCellClassName,
            'text-center tabular-nums font-medium',
            item.pesoVariavel && temDivergenciaPeso && pesoDivergenciaClasse,
            !item.pesoVariavel && item.pesoFisico !== null && 'text-foreground',
            !item.pesoVariavel && item.pesoFisico === null && 'text-muted-foreground',
          )}
          title={
            !item.pesoVariavel && item.pesoFisico !== null
              ? 'Peso conferido calculado (quantidade × peso da unidade)'
              : undefined
          }
        >
          {item.pesoFisico !== null ? formatPesoKg(item.pesoFisico) : '—'}
        </td>
        <td className={conferenciaTableCellClassName}>
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

      {temLotes && isLoteExpanded ? (
        <tr className="bg-muted/20">
          <td className="px-2 py-2" colSpan={COL_SPAN}>
            <div className="border-l-2 border-primary/30 pl-3">
              <ConferenciaLoteExpand
                lotes={item.lotesDetalhe}
                produto={item.produto}
                unidadesPorCaixa={unidadesPorCaixa}
              />
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
});
