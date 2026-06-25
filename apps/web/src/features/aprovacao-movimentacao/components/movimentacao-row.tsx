'use client';

import { Button, cn } from '@lilog/ui';
import { Info, Package, Truck, Warehouse } from 'lucide-react';

import { MovimentacaoPriorityBadge } from '@/features/aprovacao-movimentacao/components/movimentacao-priority-badge';
import type { MovimentacaoItem } from '@/features/aprovacao-movimentacao/types/aprovacao-movimentacao.schema';

type MovimentacaoRowProps = {
  item: MovimentacaoItem;
  selecionado: boolean;
  processando: boolean;
  onToggleSelecionado: (id: string) => void;
  onAprovar: (id: string) => void;
  onReprovar: (id: string) => void;
  onVerDetalhes: (id: string) => void;
};

function LocalBadge({
  icon: Icon,
  label,
}: {
  icon: typeof Warehouse;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs text-foreground">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      {label}
    </span>
  );
}

export function MovimentacaoRow({
  item,
  selecionado,
  processando,
  onToggleSelecionado,
  onAprovar,
  onReprovar,
  onVerDetalhes,
}: MovimentacaoRowProps) {
  const destinoIcon =
    item.destino.startsWith('DOCA') || item.destino.startsWith('EXPED')
      ? Truck
      : Package;

  return (
    <tr className="group transition-colors hover:bg-primary/5">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selecionado}
          onChange={() => onToggleSelecionado(item.id)}
          aria-label={`Selecionar ${item.codigo}`}
          className="size-4 rounded border-input accent-primary"
        />
      </td>
      <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
        {item.codigo}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">
            {item.produto}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {item.sku} | Lote: {item.lote}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <LocalBadge icon={Warehouse} label={item.origem} />
      </td>
      <td className="px-4 py-3">
        <LocalBadge icon={destinoIcon} label={item.destino} />
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex rounded border border-outline-variant bg-muted px-2 py-1',
            'text-[11px] font-semibold uppercase tracking-wide text-foreground',
          )}
        >
          {item.motivoRegra}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <MovimentacaoPriorityBadge prioridade={item.prioridade} />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            title="Detalhes"
            aria-label={`Ver detalhes de ${item.codigo}`}
            disabled={processando}
            onClick={() => onVerDetalhes(item.id)}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
          >
            <Info className="size-4" aria-hidden />
          </button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={processando}
            onClick={() => void onReprovar(item.id)}
            className="h-7 border-destructive/50 px-3 text-[11px] font-semibold uppercase text-destructive hover:bg-destructive/10"
          >
            Reprovar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={processando}
            onClick={() => void onAprovar(item.id)}
            className="h-7 px-3 text-[11px] font-semibold uppercase"
          >
            Aprovar
          </Button>
        </div>
      </td>
    </tr>
  );
}
