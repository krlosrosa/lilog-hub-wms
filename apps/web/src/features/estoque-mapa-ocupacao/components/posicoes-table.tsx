'use client';

import { Loader2, MapPin } from 'lucide-react';

import { cn } from '@lilog/ui';

import {
  compactTableBodyClassName,
  compactTableCellClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import {
  CurvaAbcBadge,
  EnderecoStatusBadge,
} from '@/features/enderecos/components/endereco-status-badge';
import { ENDERECO_TIPO_LABELS } from '@/features/enderecos/types/enderecos-gestao.schema';
import type { EnderecoListaItem } from '@/features/enderecos/types/enderecos-gestao.schema';

type PosicoesTableProps = {
  posicoes: EnderecoListaItem[];
  isLoading: boolean;
  totalFiltrados: number;
  onSelectPosicao: (item: EnderecoListaItem) => void;
};

const nf = new Intl.NumberFormat('pt-BR');

function OcupacaoBar({ percent }: { percent: number }) {
  const value = Math.round(Math.min(100, Math.max(0, percent)));

  return (
    <div className="flex min-w-[6.5rem] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            value >= 90
              ? 'bg-destructive'
              : value >= 70
                ? 'bg-amber-500'
                : value > 0
                  ? 'bg-primary'
                  : 'bg-muted-foreground/30',
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <span
        className={cn(
          'w-8 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums',
          value >= 90
            ? 'text-destructive'
            : value >= 70
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-foreground',
        )}
      >
        {value}%
      </span>
    </div>
  );
}

function rowStatusClassName(status: EnderecoListaItem['status']): string {
  switch (status) {
    case 'bloqueado':
      return 'bg-destructive/[0.03]';
    case 'inventario':
      return 'bg-secondary/[0.04]';
    case 'inativo':
      return 'opacity-60';
    default:
      return '';
  }
}

export function PosicoesTable({
  posicoes,
  isLoading,
  totalFiltrados,
  onSelectPosicao,
}: PosicoesTableProps) {
  return (
    <div className="overflow-hidden border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant px-3 py-2">
        <p className="text-xs text-muted-foreground">
          {isLoading ? (
            'Carregando posições...'
          ) : (
            <>
              <span className="font-semibold text-foreground">
                {nf.format(totalFiltrados)}
              </span>{' '}
              {totalFiltrados === 1 ? 'posição' : 'posições'}
              {posicoes.length > 0 && totalFiltrados > posicoes.length ? (
                <span className="ml-1">
                  · exibindo {posicoes.length} nesta página
                </span>
              ) : null}
            </>
          )}
        </p>
        {!isLoading && posicoes.length > 0 ? (
          <p className="text-[10px] text-muted-foreground">
            Clique na linha para ver detalhes
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className={compactTableClassName}>
          <thead>
            <tr className={compactTableHeadRowClassName}>
              <th className={compactTableHeadCellClassName('min-w-[8rem]')}>
                Posição
              </th>
              <th className={compactTableHeadCellClassName('w-12')}>Zona</th>
              <th className={compactTableHeadCellClassName('hidden sm:table-cell')}>
                Tipo
              </th>
              <th className={compactTableHeadCellClassName('w-24')}>Status</th>
              <th className={compactTableHeadCellClassName('min-w-[7rem]')}>
                Ocupação
              </th>
              <th className={compactTableHeadCellClassName('hidden md:table-cell w-24 text-right')}>
                Capacidade
              </th>
              <th className={compactTableHeadCellClassName('w-10 text-center')}>
                ABC
              </th>
            </tr>
          </thead>
          <tbody className={compactTableBodyClassName}>
            {isLoading ? (
              <tr>
                <td colSpan={7} className={compactTableEmptyCellClassName}>
                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Carregando posições...
                  </span>
                </td>
              </tr>
            ) : posicoes.length === 0 ? (
              <tr>
                <td colSpan={7} className={compactTableEmptyCellClassName}>
                  <div className="flex flex-col items-center gap-2 py-8">
                    <MapPin
                      className="size-7 text-muted-foreground"
                      aria-hidden
                    />
                    <p className="text-sm font-medium text-foreground">
                      Nenhuma posição encontrada
                    </p>
                    <p className="max-w-sm text-xs text-muted-foreground">
                      Ajuste os filtros ou cadastre endereços na unidade.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              posicoes.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    compactTableRowClassName,
                    'cursor-pointer',
                    rowStatusClassName(item.status),
                    'hover:bg-surface-highest/50 focus-visible:bg-surface-highest/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30',
                  )}
                  onClick={() => onSelectPosicao(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelectPosicao(item);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Ver detalhes da posição ${item.enderecoId}`}
                >
                  <td className={compactTableCellClassName}>
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold text-primary">
                        {item.enderecoId}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Rua {item.rua} · Pos. {item.posicao} · Nív. {item.nivel}
                      </p>
                    </div>
                  </td>
                  <td className={compactTableCellClassName}>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {item.zona}
                    </span>
                  </td>
                  <td
                    className={cn(
                      compactTableCellClassName,
                      'hidden sm:table-cell',
                    )}
                  >
                    <span className="text-xs text-foreground">
                      {ENDERECO_TIPO_LABELS[item.tipo]}
                    </span>
                  </td>
                  <td className={compactTableCellClassName}>
                    <EnderecoStatusBadge status={item.status} compact />
                  </td>
                  <td className={compactTableCellClassName}>
                    <OcupacaoBar percent={item.ocupacaoPercent} />
                  </td>
                  <td
                    className={cn(
                      compactTableCellClassName,
                      'hidden text-right md:table-cell',
                    )}
                  >
                    <span className="font-mono text-[11px] tabular-nums text-foreground">
                      {nf.format(item.capacidadeKg)} kg
                    </span>
                  </td>
                  <td className={cn(compactTableCellClassName, 'text-center')}>
                    <CurvaAbcBadge curva={item.curvaAbc} compact />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
