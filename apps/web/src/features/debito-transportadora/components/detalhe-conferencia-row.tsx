'use client';

import { useEffect, useState } from 'react';

import { Trash2 } from 'lucide-react';

import { cn } from '@lilog/ui';

import type { AtualizarItemProcessoDebitoBody } from '@/features/debito-transportadora/lib/cobranca-transportadora-api';
import {
  DEBITO_ITEM_STATUS_LABELS,
  type DebitoConferenciaItem,
  type DebitoItemStatus,
} from '@/features/debito-transportadora/types/debito.schema';

type DetalheConferenciaRowProps = {
  item: DebitoConferenciaItem;
  selected: boolean;
  disabled?: boolean;
  onToggleSelect: (itemId: string) => void;
  onUpdateItem: (
    itemId: string,
    body: AtualizarItemProcessoDebitoBody,
  ) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
};

function formatPesoKg(value: number) {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })} kg`;
}

function formatMoeda(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

const STATUS_OPTIONS: DebitoItemStatus[] = ['cobrar', 'nao_cobrar', 'sobra'];

export function DetalheConferenciaRow({
  item,
  selected,
  disabled = false,
  onToggleSelect,
  onUpdateItem,
  onRemoveItem,
}: DetalheConferenciaRowProps) {
  const temAnomalia = item.anomalia !== null;
  const isSobra = item.anomalia === 'sobra';
  const statusAtual = isSobra ? 'sobra' : item.status;

  const [quantidade, setQuantidade] = useState(String(item.quantidade));
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    setQuantidade(String(item.quantidade));
  }, [item.quantidade]);

  useEffect(() => {
    setObservacao(item.observacao ?? '');
  }, [item.id]);

  const salvarQuantidade = async () => {
    const parsed = Number(quantidade);

    if (!Number.isFinite(parsed) || parsed <= 0 || parsed === item.quantidade) {
      setQuantidade(String(item.quantidade));
      return;
    }

    await onUpdateItem(item.id, { quantidade: parsed });
  };

  const salvarObservacao = async () => {
    const valor = observacao.trim() || null;
    const atual = item.observacao?.trim() || null;

    if (valor === atual) {
      return;
    }

    await onUpdateItem(item.id, { observacao: valor });
  };

  const alterarStatus = async (status: DebitoItemStatus) => {
    if (status === statusAtual) {
      return;
    }

    await onUpdateItem(item.id, { status });
  };

  const remover = async () => {
    const confirmado = window.confirm(
      `Remover o item ${item.sku} — ${item.produto}?`,
    );

    if (!confirmado) {
      return;
    }

    await onRemoveItem(item.id);
  };

  return (
    <tr
      className={cn(
        'transition-colors hover:bg-surface-highest/50',
        temAnomalia && !isSobra && 'bg-destructive/5',
        isSobra && 'bg-status-active/5',
        selected && 'bg-primary/5',
      )}
    >
      <td className="px-2 py-1.5">
        <input
          type="checkbox"
          checked={selected}
          disabled={disabled}
          onChange={() => onToggleSelect(item.id)}
          aria-label={`Selecionar item ${item.sku}`}
          className="size-3.5 rounded border-input accent-primary"
        />
      </td>
      <td className="px-2 py-1.5">
        <span className="inline-flex rounded-md border border-outline-variant/60 bg-surface-low px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
          {item.nfNumero}
        </span>
      </td>
      <td className="px-2 py-1.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] text-muted-foreground">{item.sku}</p>
          <p className="truncate text-[11px] font-semibold text-foreground">
            {item.produto}
          </p>
        </div>
      </td>
      <td className="px-2 py-1.5">
        <input
          type="number"
          min={0.001}
          step="any"
          value={quantidade}
          disabled={disabled}
          onChange={(event) => setQuantidade(event.target.value)}
          onBlur={() => void salvarQuantidade()}
          aria-label={`Quantidade do item ${item.sku}`}
          className={cn(
            'h-7 w-20 rounded-md border border-input bg-surface px-2',
            'text-center text-[11px] tabular-nums text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring',
          )}
        />
      </td>
      <td className="px-2 py-1.5">
        <select
          value={statusAtual}
          disabled={disabled || isSobra}
          onChange={(event) =>
            void alterarStatus(event.target.value as DebitoItemStatus)
          }
          aria-label={`Status de cobrança do item ${item.sku}`}
          className={cn(
            'h-7 min-w-[108px] rounded-md border border-input bg-surface px-1.5',
            'text-[10px] font-semibold text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            isSobra && 'cursor-not-allowed opacity-70',
          )}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {DEBITO_ITEM_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums text-[11px] font-semibold text-foreground">
        {item.pesoTotalKg != null ? formatPesoKg(item.pesoTotalKg) : '—'}
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums text-[11px] font-semibold text-foreground">
        {item.valorDebito > 0 ? formatMoeda(item.valorDebito) : '—'}
      </td>
      <td className="px-2 py-1.5">
        <input
          type="text"
          value={observacao}
          disabled={disabled}
          onChange={(event) => setObservacao(event.target.value)}
          onBlur={() => void salvarObservacao()}
          placeholder="Observação..."
          aria-label={`Observação do item ${item.sku}`}
          className={cn(
            'h-7 w-full min-w-[120px] rounded-md border border-input bg-surface px-2',
            'text-[11px] text-foreground placeholder:text-muted-foreground/50',
            'focus:outline-none focus:ring-2 focus:ring-ring',
          )}
        />
      </td>
      <td className="px-2 py-1.5 text-center">
        <button
          type="button"
          disabled={disabled}
          onClick={() => void remover()}
          aria-label={`Remover item ${item.sku}`}
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-md',
            'text-destructive transition-colors hover:bg-destructive/10',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </button>
      </td>
    </tr>
  );
}
