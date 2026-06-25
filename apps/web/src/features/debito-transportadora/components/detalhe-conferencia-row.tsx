'use client';

import { cn } from '@lilog/ui';

import { DebitoOperacaoNfBadge } from '@/features/debito-transportadora/components/debito-operacao-nf-badge';
import type {
  DebitoConferenciaItem,
  DebitoNotaFiscal,
} from '@/features/debito-transportadora/types/debito.schema';
import { DEBITO_ANOMALIA_LABELS } from '@/features/debito-transportadora/types/debito.schema';

type DetalheConferenciaRowProps = {
  item: DebitoConferenciaItem;
  notaFiscal?: DebitoNotaFiscal;
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function DetalheConferenciaRow({
  item,
  notaFiscal,
}: DetalheConferenciaRowProps) {
  const formato = Intl.NumberFormat('pt-BR');
  const divergencia = item.qtdConferida - item.qtdEsperada;
  const temAnomalia = item.anomalia !== null;

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
      className={cn(
        'transition-colors hover:bg-surface-highest/50',
        temAnomalia && 'bg-destructive/5',
      )}
    >
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded text-[9px] font-bold',
              temAnomalia
                ? item.anomalia === 'avaria'
                  ? 'bg-destructive/20 text-destructive'
                  : 'bg-secondary/25 text-secondary'
                : 'bg-primary/20 text-primary',
            )}
          >
            {item.sku}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-foreground">
              {item.produto}
            </p>
            <p className="text-[9px] text-muted-foreground">
              Lote: {item.lote}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden px-2 py-1.5 text-center sm:table-cell">
        {notaFiscal ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-mono text-[10px] font-semibold text-foreground">
              {notaFiscal.numero}
            </span>
            <DebitoOperacaoNfBadge
              operacao={notaFiscal.operacao}
              short
              className="px-1 py-0 text-[8px]"
            />
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-2 py-1.5 text-center tabular-nums font-semibold text-[11px] text-foreground">
        {formato.format(item.qtdEsperada)}
      </td>
      <td className="px-2 py-1.5 text-center tabular-nums font-semibold text-[11px] text-foreground">
        {formato.format(item.qtdConferida)}
      </td>
      <td
        className={cn(
          'px-2 py-1.5 text-center tabular-nums text-[11px] font-bold',
          divergenciaClasse,
        )}
      >
        {textoDivergencia}
      </td>
      <td className="px-2 py-1.5 text-center">
        {item.anomalia ? (
          <span
            className={cn(
              'inline-flex rounded border px-1.5 py-0 text-[9px] font-semibold',
              item.anomalia === 'avaria'
                ? 'border-destructive/40 bg-destructive/15 text-destructive'
                : 'border-secondary/40 bg-secondary/15 text-secondary',
            )}
          >
            {DEBITO_ANOMALIA_LABELS[item.anomalia]}
          </span>
        ) : (
          <span className="inline-flex rounded border border-status-active/30 bg-status-active/10 px-1.5 py-0 text-[9px] font-semibold text-status-active">
            OK
          </span>
        )}
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums text-[11px] font-semibold text-foreground">
        {item.valorImpacto != null ? formatCurrency(item.valorImpacto) : '—'}
      </td>
    </tr>
  );
}
