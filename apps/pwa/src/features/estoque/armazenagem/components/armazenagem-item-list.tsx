import { cn } from '@lilog/ui';
import { AlertTriangle, CheckCircle2, Circle, Package } from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import {
  formatQuantidadeComparacao,
  type QuantidadeArmazenagem,
} from '../lib/armazenagem-quantidade';
import type { ArmazenagemItem, ArmazenagemItemStatus } from '../types/armazenagem.schema';

const DEFAULT_STATUS_LABELS: Record<ArmazenagemItemStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  guardado: 'Guardado',
  parcial: 'Parcial',
};

function isItemPendente(status: ArmazenagemItemStatus): boolean {
  return status === 'pendente' || status === 'em_andamento';
}

function isItemProcessado(status: ArmazenagemItemStatus): boolean {
  return status === 'guardado' || status === 'parcial';
}

interface ArmazenagemItemRowProps {
  item: ArmazenagemItem;
  isActive: boolean;
  statusLabel: string;
  onSelect: () => void;
}

function ArmazenagemItemRow({
  item,
  isActive,
  statusLabel,
  onSelect,
}: ArmazenagemItemRowProps) {
  const isDone = item.status === 'guardado';
  const isParcial = item.status === 'parcial';
  const isCurrent = item.status === 'em_andamento';
  const isProcessado = isItemProcessado(item.status);

  const solicitado: QuantidadeArmazenagem = {
    caixas: item.quantidadeSolicitadaCaixas,
    unidades: item.quantidadeSolicitadaUnidades,
  };
  const guardado: QuantidadeArmazenagem = {
    caixas: item.quantidadeGuardadaCaixas ?? 0,
    unidades: item.quantidadeGuardadaUnidades ?? 0,
  };

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          hapticLight();
          onSelect();
        }}
        className={cn(
          'relative flex w-full items-center gap-3 overflow-hidden rounded-lg border bg-surface p-4 pl-5 text-left shadow-sm touch-manipulation transition-all active:scale-[0.98]',
          isActive
            ? 'border-secondary ring-1 ring-secondary/25'
            : isParcial
              ? 'border-warning/40 bg-warning-container/20 active:bg-warning-container/30'
              : isProcessado
                ? 'border-secondary/40 bg-secondary-container/30 active:bg-secondary-container/40'
                : 'border-outline-variant active:bg-surface-container-low',
          isProcessado && !isActive && !isParcial && 'opacity-90'
        )}
      >
        <span
          className={cn(
            'absolute bottom-3 left-0 top-3 w-1 rounded-r-full',
            isDone
              ? 'bg-secondary'
              : isParcial
                ? 'bg-warning'
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
              : isParcial
                ? 'bg-warning-container text-on-warning-container'
                : isCurrent
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-surface-container text-on-surface-variant'
          )}
        >
          {isDone ? (
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          ) : isParcial ? (
            <AlertTriangle className="h-5 w-5" aria-hidden />
          ) : (
            item.sequence
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-mono text-label-md font-bold text-primary">
              {item.codigoProduto}
            </p>
            {isParcial && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-warning-container px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-on-warning-container">
                <AlertTriangle className="h-2.5 w-2.5" aria-hidden />
                Parcial
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-body-sm text-on-surface-variant">
            {item.nomeProduto}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-label-sm text-on-surface-variant">
            <span>{statusLabel}</span>
            <span className="text-outline">·</span>
            <span className="font-mono">{item.enderecoPickingDesignado}</span>
          </p>
          {isParcial && (
            <p className="mt-1 font-mono text-label-sm font-semibold text-warning">
              {formatQuantidadeComparacao(solicitado, guardado)}
            </p>
          )}
        </div>
        {isParcial ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden />
        ) : isProcessado ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
        ) : (
          <Package
            className={cn(
              'h-4 w-4 shrink-0',
              isCurrent ? 'text-secondary' : 'text-outline'
            )}
            aria-hidden
          />
        )}
      </button>
    </li>
  );
}

interface ArmazenagemItemListProps {
  itens: ArmazenagemItem[];
  activeCodigoProduto?: string;
  onSelectItem: (codigoProduto: string) => void;
  statusLabels?: Partial<Record<ArmazenagemItemStatus, string>>;
}

export function ArmazenagemItemList({
  itens,
  activeCodigoProduto,
  onSelectItem,
  statusLabels,
}: ArmazenagemItemListProps) {
  const labels = { ...DEFAULT_STATUS_LABELS, ...statusLabels };

  const pendentes = itens.filter((item) => isItemPendente(item.status));
  const parciais = itens.filter((item) => item.status === 'parcial');
  const guardadosCompletos = itens.filter((item) => item.status === 'guardado');
  const processados = itens.filter((item) => isItemProcessado(item.status));

  const progressPercent =
    itens.length > 0 ? Math.round((processados.length / itens.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <p className="text-body-sm text-on-surface-variant">
          {processados.length}/{itens.length} itens processados nesta demanda
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface-variant">
            <Circle className="h-3 w-3 text-outline" aria-hidden />
            {pendentes.length} a guardar
          </span>
          {parciais.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-container px-3 py-1 text-label-sm text-on-warning-container">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              {parciais.length} parcial
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-label-sm text-secondary">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            {guardadosCompletos.length} completos
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
          <div
            className="h-full rounded-full bg-secondary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={processados.length}
            aria-valuemin={0}
            aria-valuemax={itens.length}
            aria-label="Progresso da armazenagem"
          />
        </div>
      </div>

      {pendentes.length > 0 && (
        <section>
          <h4 className="mb-2 text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
            A guardar ({pendentes.length})
          </h4>
          <ul className="space-y-2" role="list" aria-label="Itens pendentes de armazenagem">
            {pendentes.map((item) => (
              <ArmazenagemItemRow
                key={item.id}
                item={item}
                isActive={activeCodigoProduto?.trim() === item.codigoProduto}
                statusLabel={labels[item.status]}
                onSelect={() => onSelectItem(item.codigoProduto)}
              />
            ))}
          </ul>
        </section>
      )}

      {parciais.length > 0 && (
        <section>
          <h4 className="mb-2 flex items-center gap-1.5 text-label-md font-semibold uppercase tracking-wider text-warning">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Armazenagem parcial ({parciais.length})
          </h4>
          <ul className="space-y-2" role="list" aria-label="Itens com armazenagem parcial">
            {parciais.map((item) => (
              <ArmazenagemItemRow
                key={item.id}
                item={item}
                isActive={activeCodigoProduto?.trim() === item.codigoProduto}
                statusLabel={labels[item.status]}
                onSelect={() => onSelectItem(item.codigoProduto)}
              />
            ))}
          </ul>
        </section>
      )}

      {guardadosCompletos.length > 0 && (
        <section>
          <h4 className="mb-2 text-label-md font-semibold uppercase tracking-wider text-secondary">
            Guardados ({guardadosCompletos.length})
          </h4>
          <ul className="space-y-2" role="list" aria-label="Itens guardados por completo">
            {guardadosCompletos.map((item) => (
              <ArmazenagemItemRow
                key={item.id}
                item={item}
                isActive={activeCodigoProduto?.trim() === item.codigoProduto}
                statusLabel={labels[item.status]}
                onSelect={() => onSelectItem(item.codigoProduto)}
              />
            ))}
          </ul>
        </section>
      )}

      {pendentes.length === 0 && processados.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-6 py-12 text-center">
          <Package className="h-10 w-10 text-outline" aria-hidden />
          <p className="text-body-sm text-on-surface-variant">
            Nenhum item nesta demanda.
          </p>
        </div>
      )}
    </div>
  );
}
