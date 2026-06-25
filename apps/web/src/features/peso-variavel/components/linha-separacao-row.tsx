'use client';

import { cn } from '@lilog/ui';

import { LinhaSeparacaoStatusBadge } from '@/features/peso-variavel/components/linha-separacao-status-badge';
import type { LinhaSeparacao } from '@/features/peso-variavel/types/peso-variavel-etiquetas.schema';

const cellClassName = 'px-1.5 py-0.5 text-[10px] leading-tight';

export type LinhaSeparacaoRowProps = {
  linha: LinhaSeparacao;
  selecionada: boolean;
  onToggle: (id: string) => void;
};

export function LinhaSeparacaoRow({
  linha,
  selecionada,
  onToggle,
}: LinhaSeparacaoRowProps) {
  return (
    <tr className="group transition-colors hover:bg-surface-highest/50">
      <td className={cellClassName}>
        <input
          type="checkbox"
          checked={selecionada}
          onChange={() => onToggle(linha.id)}
          aria-label={`Selecionar linha ${linha.sku} — ${linha.descricao}`}
          className="size-3 rounded border-outline-variant text-primary focus-visible:ring-2 focus-visible:ring-ring"
        />
      </td>
      <td className={cn(cellClassName, 'font-mono text-foreground')}>
        {linha.transporte}
      </td>
      <td className={cn(cellClassName, 'font-mono text-foreground')}>
        {linha.remessa}
      </td>
      <td className={cn(cellClassName, 'font-mono text-muted-foreground')}>
        {linha.cliente}
      </td>
      <td className={cn(cellClassName, 'max-w-[120px] truncate text-foreground')}>
        {linha.nomeCliente}
      </td>
      <td className={cn(cellClassName, 'font-mono font-semibold text-primary')}>
        {linha.sku}
      </td>
      <td className={cn(cellClassName, 'max-w-[140px] truncate text-foreground')}>
        {linha.descricao}
      </td>
      <td className={cn(cellClassName, 'text-right font-semibold tabular-nums text-foreground')}>
        {linha.quantidade}
      </td>
      <td className={cellClassName}>
        <LinhaSeparacaoStatusBadge status={linha.status} />
      </td>
    </tr>
  );
}

export const linhaSeparacaoHeadCellClassName =
  'border-b border-outline-variant px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground';
