'use client';

import { Fragment, useCallback, useState } from 'react';

import { Loader2 } from 'lucide-react';

import { cn } from '@lilog/ui';

import { compactTableCellClassName } from '@/components/ui/compact-table-classes';
import {
  buildLoteKey,
  SaldoLoteRow,
} from '@/features/estoque/components/saldo-lote-row';
import { SaldoPosicoesExpandido } from '@/features/estoque/components/saldo-posicoes-expandido';
import { useSaldoLotes } from '@/features/estoque/hooks/use-saldo-lotes';
import type {
  EstoqueLoteAgrupadoItem,
  EstoqueProdutoAgrupadoItem,
  FiltroNaturezaSaldo,
  FiltroStatusSaldo,
  HistoricoProdutoSelecionado,
} from '@/features/estoque/types/estoque-gestao.schema';

type SaldoLotesExpandidoProps = {
  produto: EstoqueProdutoAgrupadoItem;
  unidadeId?: string;
  depositoId?: string;
  statusFiltro: FiltroStatusSaldo;
  naturezaFiltro: FiltroNaturezaSaldo;
  loteFiltro: string;
  gruposFiltro: string[];
  expandido: boolean;
  onVerHistoricoLote?: (item: EstoqueLoteAgrupadoItem) => void;
  onVerHistoricoPosicao?: (params: HistoricoProdutoSelecionado) => void;
};

export function SaldoLotesExpandido({
  produto,
  unidadeId,
  depositoId,
  statusFiltro,
  naturezaFiltro,
  loteFiltro,
  gruposFiltro,
  expandido,
  onVerHistoricoLote,
  onVerHistoricoPosicao,
}: SaldoLotesExpandidoProps) {
  const [lotesExpandidos, setLotesExpandidos] = useState<Set<string>>(new Set());

  const { isLoading, lotes } = useSaldoLotes({
    unidadeId,
    produtoId: produto.produtoId,
    depositoId,
    statusFiltro,
    naturezaFiltro,
    loteFiltro,
    gruposFiltro,
    enabled: expandido,
  });

  const toggleLoteExpandido = useCallback((key: string) => {
    setLotesExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  if (!expandido) {
    return null;
  }

  if (isLoading) {
    return (
      <tr className="border-b border-outline-variant/40 bg-surface-low/30">
        <td colSpan={12} className={cn(compactTableCellClassName, 'py-4')}>
          <span className="inline-flex items-center gap-2 pl-8 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Carregando lotes...
          </span>
        </td>
      </tr>
    );
  }

  if (lotes.length === 0) {
    return (
      <tr className="border-b border-outline-variant/40 bg-surface-low/30">
        <td colSpan={12} className={cn(compactTableCellClassName, 'py-4')}>
          <p className="pl-8 text-xs text-muted-foreground">
            Nenhum lote encontrado para este produto.
          </p>
        </td>
      </tr>
    );
  }

  return (
    <>
      {lotes.map((lote) => {
        const loteKey = buildLoteKey(lote);
        const loteExpandido = lotesExpandidos.has(loteKey);

        return (
          <Fragment key={loteKey}>
            <SaldoLoteRow
              item={lote}
              expandido={loteExpandido}
              nested
              onToggleExpandido={() => toggleLoteExpandido(loteKey)}
              onVerHistorico={onVerHistoricoLote}
            />
            <SaldoPosicoesExpandido
              item={lote}
              unidadeId={unidadeId}
              depositoId={depositoId}
              expandido={loteExpandido}
              nested
              onVerHistoricoPosicao={onVerHistoricoPosicao}
            />
          </Fragment>
        );
      })}
    </>
  );
}
