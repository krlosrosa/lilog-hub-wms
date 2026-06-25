'use client';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import { ArrowRight, Truck } from 'lucide-react';

import { formatarMoeda } from '@/features/transporte/lib/calcular-custo';
import { StatusCustoBadge } from '@/features/transporte/components/status-custo-badge';
import type { CustoFreteItem } from '@/features/transporte/types/transporte.schema';

const CELL = 'px-3 py-2.5 align-middle';

const NIVEL_ROW_ACCENT: Record<
  CustoFreteItem['nivelVariacao'],
  { border: string; hover: string }
> = {
  dentro: {
    border: 'border-l-tertiary/70',
    hover: 'hover:bg-tertiary/[0.04]',
  },
  atencao: {
    border: 'border-l-secondary/70',
    hover: 'hover:bg-secondary/[0.04]',
  },
  acima: {
    border: 'border-l-destructive/70',
    hover: 'hover:bg-destructive/[0.04]',
  },
};

const NIVEL_VARIACAO_COLOR: Record<CustoFreteItem['nivelVariacao'], string> = {
  dentro: 'text-tertiary',
  atencao: 'text-secondary',
  acima: 'text-destructive',
};

type CustoFreteRowProps = {
  item: CustoFreteItem;
};

export function CustoFreteRow({ item }: CustoFreteRowProps) {
  const { transporte, custoFrete, custoPrevisto, variacaoValor, variacaoPercentual, nivelVariacao } =
    item;
  const accent = NIVEL_ROW_ACCENT[nivelVariacao];
  const variacaoPositiva = variacaoValor >= 0;
  const transportadora = transporte.veiculoAlocado?.transportadora ?? '—';
  const placa = transporte.veiculoAlocado?.placa ?? '—';

  return (
    <tr
      className={cn(
        'border-b border-outline-variant/50 border-l-[3px] transition-colors',
        accent.border,
        accent.hover,
      )}
    >
      <td className={cn(CELL, 'font-medium text-foreground')}>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">{transporte.rota}</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {transporte.cidade} · {transporte.bairro}
          </p>
        </div>
      </td>
      <td className={cn(CELL, 'hidden text-xs text-muted-foreground sm:table-cell')}>
        {transporte.dataTransporte}
      </td>
      <td className={cn(CELL, 'hidden md:table-cell')}>
        <div className="flex min-w-0 items-center gap-1.5">
          <Truck className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-xs">{transportadora}</p>
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {placa}
            </p>
          </div>
        </div>
      </td>
      <td className={cn(CELL, 'text-right font-mono text-xs')}>
        {formatarMoeda(custoPrevisto)}
      </td>
      <td className={cn(CELL, 'text-right font-mono text-xs')}>
        {custoFrete.totalPago > 0 ? formatarMoeda(custoFrete.totalPago) : '—'}
      </td>
      <td className={cn(CELL, 'hidden text-right font-mono text-xs lg:table-cell')}>
        {custoFrete.totalAdicionais > 0
          ? formatarMoeda(custoFrete.totalAdicionais)
          : '—'}
      </td>
      <td className={cn(CELL, 'text-right')}>
        {custoFrete.totalPago > 0 ? (
          <div>
            <p
              className={cn(
                'font-mono text-xs font-semibold',
                NIVEL_VARIACAO_COLOR[nivelVariacao],
              )}
            >
              {variacaoPositiva ? '+' : ''}
              {formatarMoeda(variacaoValor)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {variacaoPositiva ? '+' : ''}
              {variacaoPercentual.toFixed(1)}%
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className={CELL}>
        <StatusCustoBadge status={custoFrete.status} />
      </td>
      <td className={cn(CELL, 'text-right')}>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" asChild>
          <Link href={`/transporte/custos-frete/${custoFrete.id}`}>
            Detalhe
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </Button>
      </td>
    </tr>
  );
}
