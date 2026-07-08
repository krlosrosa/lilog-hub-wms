'use client';

import Link from 'next/link';

import { History, Loader2, Settings2 } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { EstoqueStatusBadge } from '@/features/estoque/components/estoque-status-badge';
import { SaldoCell } from '@/features/estoque/components/saldo-cell';
import { useSaldoPosicoes } from '@/features/estoque/hooks/use-saldo-posicoes';
import type {
  EstoqueLoteAgrupadoItem,
  EstoqueListaItem,
  HistoricoProdutoSelecionado,
} from '@/features/estoque/types/estoque-gestao.schema';

const df = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

type SaldoPosicoesExpandidoProps = {
  item: EstoqueLoteAgrupadoItem;
  unidadeId?: string;
  depositoId?: string;
  expandido: boolean;
  nested?: boolean;
  onVerHistoricoPosicao?: (params: HistoricoProdutoSelecionado) => void;
};

function PosicaoRow({
  posicao,
  loteItem,
  onVerHistoricoPosicao,
}: {
  posicao: EstoqueListaItem;
  loteItem: EstoqueLoteAgrupadoItem;
  onVerHistoricoPosicao?: (params: HistoricoProdutoSelecionado) => void;
}) {
  const statusSaldo =
    posicao.saldoBloqueado > 0 && posicao.saldoFisico === 0
      ? 'bloqueado'
      : 'liberado';

  return (
    <tr
      className={cn(
        compactTableRowClassName,
        'border-l-2 border-l-tertiary/40 bg-surface-low/30',
      )}
    >
      <td className={cn(compactTableCellClassName, 'w-10 pl-12')} />

      <td className={cn(compactTableCellClassName, 'min-w-[200px] pl-2')}>
        <Link
          href={`/enderecos/${posicao.enderecoId}`}
          className="group block min-w-0"
        >
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-tertiary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-tertiary">
              Posição
            </span>
            <p className="truncate font-mono text-xs font-bold tracking-tight text-primary group-hover:underline">
              {posicao.enderecoMascarado}
            </p>
          </div>
        </Link>
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden min-w-[72px] sm:table-cell',
        )}
      >
        <span className="text-[11px] text-muted-foreground">—</span>
      </td>

      <td className={cn(compactTableCellClassName, 'min-w-[120px]')}>
        <p className="truncate text-[11px] text-foreground">
          {posicao.depositoCodigo} · {posicao.depositoNome}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {posicao.numeroSerie ? `Série ${posicao.numeroSerie}` : 'Sem série'}
          {posicao.validade
            ? ` · Val. ${df.format(new Date(posicao.validade))}`
            : ''}
        </p>
      </td>

      <td className={cn(compactTableCellClassName, 'text-right')}>
        <SaldoCell value={posicao.saldoFisico} />
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden text-right xl:table-cell',
        )}
      >
        {posicao.pesoLiquidoTotalKg != null ? (
          <SaldoCell value={posicao.pesoLiquidoTotalKg} tone="muted" />
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
        <SaldoCell value={posicao.saldoReservado} tone="warning" />
      </td>

      <td className={cn(compactTableCellClassName, 'text-right')}>
        <SaldoCell value={posicao.saldoDisponivel} tone="positive" />
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden text-right xl:table-cell',
        )}
      >
        <SaldoCell value={posicao.saldoBloqueado} tone="critical" />
      </td>

      <td className={compactTableCellClassName}>
        <EstoqueStatusBadge variant="status" value={statusSaldo} compact />
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden min-w-[108px] 2xl:table-cell',
        )}
      />

      <td className={cn(compactTableCellClassName, 'w-10 text-right')}>
        <div className="flex items-center justify-end gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-primary"
            aria-label={`Gerenciar posição ${posicao.enderecoMascarado}`}
            asChild
          >
            <Link href={`/estoque/saldo/${posicao.saldoEnderecoId}`}>
              <Settings2 className="size-3.5" aria-hidden />
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-primary"
            aria-label={`Ver histórico da posição ${posicao.enderecoMascarado}`}
            onClick={() =>
              onVerHistoricoPosicao?.({
                produtoId: loteItem.produtoId,
                produtoSku: loteItem.produtoSku,
                produtoDescricao: loteItem.produtoDescricao,
                lote: loteItem.lote,
                depositoId: posicao.depositoId,
                enderecoId: posicao.enderecoId,
                enderecoMascarado: posicao.enderecoMascarado,
              })
            }
          >
            <History className="size-3.5" aria-hidden />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function SaldoPosicoesExpandido({
  item,
  unidadeId,
  depositoId,
  expandido,
  nested = false,
  onVerHistoricoPosicao,
}: SaldoPosicoesExpandidoProps) {
  const { isLoading, itens } = useSaldoPosicoes({
    unidadeId,
    produtoId: item.produtoId,
    lote: item.lote,
    depositoId,
    enabled: expandido,
  });

  if (!expandido) {
    return null;
  }

  if (!nested) {
    return (
      <tr className="border-b border-outline-variant/40 bg-surface-low/50">
        <td colSpan={12} className="p-0">
          <div className="border-t border-outline-variant/30 px-4 py-3 sm:px-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Posições do lote {item.lote || '—'}
            </p>
            {isLoading ? (
              <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Carregando posições...
              </div>
            ) : itens.length === 0 ? (
              <p className="py-4 text-xs text-muted-foreground">
                Nenhuma posição encontrada para este lote.
              </p>
            ) : (
              <div className="space-y-1">
                {itens.map((posicao) => (
                  <PosicaoRow
                    key={`${posicao.depositoId}-${posicao.enderecoId}-${posicao.numeroSerie}-${posicao.validade ?? ''}`}
                    posicao={posicao}
                    loteItem={item}
                    onVerHistoricoPosicao={onVerHistoricoPosicao}
                  />
                ))}
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  }

  if (isLoading) {
    return (
      <tr className="border-b border-outline-variant/40 bg-surface-low/30">
        <td colSpan={12} className={cn(compactTableCellClassName, 'py-3')}>
          <span className="inline-flex items-center gap-2 pl-12 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Carregando posições...
          </span>
        </td>
      </tr>
    );
  }

  if (itens.length === 0) {
    return (
      <tr className="border-b border-outline-variant/40 bg-surface-low/30">
        <td colSpan={12} className={cn(compactTableCellClassName, 'py-3')}>
          <p className="pl-12 text-xs text-muted-foreground">
            Nenhuma posição encontrada para este lote.
          </p>
        </td>
      </tr>
    );
  }

  return (
    <>
      {itens.map((posicao) => (
        <PosicaoRow
          key={`${posicao.depositoId}-${posicao.enderecoId}-${posicao.numeroSerie}-${posicao.validade ?? ''}`}
          posicao={posicao}
          loteItem={item}
          onVerHistoricoPosicao={onVerHistoricoPosicao}
        />
      ))}
    </>
  );
}
