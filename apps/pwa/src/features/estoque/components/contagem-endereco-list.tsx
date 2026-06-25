import { cn } from '@lilog/ui';
import { AlertTriangle, CheckCircle2, Circle, MapPin } from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import { normalizeContagemEndereco } from '../lib/contagem-avarias-store';
import type { InventoryAddress, InventoryAddressStatus } from '../types/estoque.schema';

const DEFAULT_STATUS_LABELS: Record<InventoryAddressStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  conferido: 'Conferido',
};

interface ContagemEnderecoListProps {
  enderecos: InventoryAddress[];
  activeEndereco?: string;
  onSelectEndereco: (endereco: string) => void;
  statusLabels?: Partial<Record<InventoryAddressStatus, string>>;
  doneSummaryLabel?: string;
  enderecosComAvaria?: Set<string>;
}

export function ContagemEnderecoList({
  enderecos,
  activeEndereco,
  onSelectEndereco,
  statusLabels,
  doneSummaryLabel = 'conferidos',
  enderecosComAvaria,
}: ContagemEnderecoListProps) {
  const labels = { ...DEFAULT_STATUS_LABELS, ...statusLabels };
  const pendentes = enderecos.filter((item) => item.status === 'pendente').length;
  const concluidos = enderecos.filter((item) => item.status === 'conferido').length;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <p className="text-body-sm text-on-surface-variant">
          Endereços que você precisa visitar nesta demanda.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface-variant">
            <Circle className="h-3 w-3 text-outline" aria-hidden />
            {pendentes} pendentes
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-label-sm text-secondary">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            {concluidos} {doneSummaryLabel}
          </span>
        </div>
      </div>

      <ul className="space-y-2" aria-label="Lista de endereços da demanda">
        {enderecos.map((item) => {
          const isActive = activeEndereco?.trim() === item.endereco;
          const isDone = item.status === 'conferido';
          const isCurrent = item.status === 'em_andamento';
          const temAvaria =
            enderecosComAvaria?.has(normalizeContagemEndereco(item.endereco)) ?? false;

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  onSelectEndereco(item.endereco);
                }}
                className={cn(
                  'relative flex w-full items-center gap-3 overflow-hidden rounded-lg border bg-surface p-4 pl-5 text-left shadow-sm touch-manipulation transition-all active:scale-[0.98]',
                  isActive
                    ? 'border-secondary ring-1 ring-secondary/25'
                    : 'border-outline-variant active:bg-surface-container-low',
                  isDone && 'opacity-70'
                )}
              >
                <span
                  className={cn(
                    'absolute bottom-3 left-0 top-3 w-1 rounded-r-full',
                    isDone
                      ? 'bg-secondary'
                      : isCurrent
                        ? 'bg-secondary-container'
                        : 'bg-outline-variant'
                  )}
                  aria-hidden
                />
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-label-sm font-bold',
                    isDone
                      ? 'bg-secondary text-on-secondary'
                      : isCurrent
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface-container text-on-surface-variant'
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden />
                  ) : (
                    item.sequence
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-data-mono font-semibold text-on-surface">
                    {item.endereco}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-label-sm text-on-surface-variant">
                    <span>{labels[item.status]}</span>
                    {temAvaria && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-warning-container px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-on-warning-container">
                        <AlertTriangle className="h-2.5 w-2.5 text-warning" aria-hidden />
                        Avaria
                      </span>
                    )}
                  </p>
                </div>
                <MapPin
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isCurrent ? 'text-secondary' : 'text-outline'
                  )}
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
