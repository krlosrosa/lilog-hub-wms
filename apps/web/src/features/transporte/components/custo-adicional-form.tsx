'use client';

import { Button, cn } from '@lilog/ui';
import { Plus, Trash2 } from 'lucide-react';

import type {
  CustoAdicionalItem,
  TipoCustoAdicional,
} from '@/features/transporte/types/transporte.schema';
import { TIPO_CUSTO_ADICIONAL_LABELS } from '@/features/transporte/types/transporte.schema';

const TIPO_OPTIONS = (
  Object.entries(TIPO_CUSTO_ADICIONAL_LABELS) as [TipoCustoAdicional, string][]
).map(([value, label]) => ({ value, label }));

const inputClass = cn(
  'w-full rounded-md border border-outline-variant bg-surface-low px-2 py-1.5',
  'text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
);

type CustoAdicionalFormProps = {
  itens: CustoAdicionalItem[];
  onAdicionar: () => void;
  onRemover: (id: string) => void;
  onAtualizar: (id: string, patch: Partial<CustoAdicionalItem>) => void;
  disabled?: boolean;
};

export function CustoAdicionalForm({
  itens,
  onAdicionar,
  onRemover,
  onAtualizar,
  disabled = false,
}: CustoAdicionalFormProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-foreground">Custos Adicionais</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 gap-1 px-2 text-[11px]"
          onClick={onAdicionar}
          disabled={disabled}
        >
          <Plus className="size-3" aria-hidden />
          Adicionar
        </Button>
      </div>

      {itens.length === 0 ? (
        <p className="rounded-md border border-dashed border-outline-variant px-3 py-3 text-center text-[11px] text-muted-foreground">
          Nenhum custo adicional. Inclua pernoite, pedágio, paletização e outros.
        </p>
      ) : (
        <div className="space-y-1.5">
          {itens.map((item) => (
            <div
              key={item.id}
              className="grid gap-1.5 rounded-md border border-outline-variant bg-surface-low/50 p-2 sm:grid-cols-[130px_1fr_100px_auto]"
            >
              <select
                className={inputClass}
                value={item.tipo}
                disabled={disabled}
                onChange={(event) =>
                  onAtualizar(item.id, {
                    tipo: event.target.value as TipoCustoAdicional,
                  })
                }
              >
                {TIPO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                className={inputClass}
                placeholder="Descrição"
                value={item.descricao}
                disabled={disabled}
                onChange={(event) =>
                  onAtualizar(item.id, { descricao: event.target.value })
                }
              />

              <input
                type="number"
                min={0}
                step={0.01}
                className={cn(inputClass, 'font-mono')}
                placeholder="0,00"
                value={item.valor || ''}
                disabled={disabled}
                onChange={(event) =>
                  onAtualizar(item.id, {
                    valor: Number.parseFloat(event.target.value) || 0,
                  })
                }
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-destructive hover:text-destructive"
                onClick={() => onRemover(item.id)}
                disabled={disabled}
                aria-label="Remover custo adicional"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
