import { cn } from '@lilog/ui';
import { AlertTriangle, CheckCircle2, Circle, Package, PackageX } from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import {
  formatQuantidadeComparacao,
  type QuantidadeSeparacao,
} from '../lib/separacao-quantidade';
import type { SeparacaoItem, SeparacaoItemStatus } from '../types/separacao.schema';

const DEFAULT_STATUS_LABELS: Record<SeparacaoItemStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  separado: 'Separado',
  parcial: 'Parcial',
  esgotado: 'Esgotado',
};

function isItemPendente(status: SeparacaoItemStatus): boolean {
  return status === 'pendente' || status === 'em_andamento';
}

function isItemProcessado(status: SeparacaoItemStatus): boolean {
  return status === 'separado' || status === 'parcial' || status === 'esgotado';
}

interface SeparacaoItemRowProps {
  item: SeparacaoItem;
  isActive: boolean;
  statusLabel: string;
  onSelect: () => void;
}

function SeparacaoItemRow({
  item,
  isActive,
  statusLabel,
  onSelect,
}: SeparacaoItemRowProps) {
  const isDone = item.status === 'separado';
  const isParcial = item.status === 'parcial';
  const isEsgotado = item.status === 'esgotado';
  const isCurrent = item.status === 'em_andamento';
  const isProcessado = isItemProcessado(item.status);

  const solicitado: QuantidadeSeparacao = {
    caixas: item.quantidadeSolicitadaCaixas,
    unidades: item.quantidadeSolicitadaUnidades,
  };
  const separado: QuantidadeSeparacao = {
    caixas: item.quantidadeSeparadaCaixas ?? 0,
    unidades: item.quantidadeSeparadaUnidades ?? 0,
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
                : isEsgotado
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
                : isEsgotado
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
          ) : isEsgotado ? (
            <PackageX className="h-5 w-5" aria-hidden />
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
            <span className="font-mono">{item.endereco}</span>
          </p>
          {isParcial && (
            <p className="mt-1 font-mono text-label-sm font-semibold text-warning">
              {formatQuantidadeComparacao(solicitado, separado)}
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

interface SeparacaoItemListProps {
  itens: SeparacaoItem[];
  activeEndereco?: string;
  onSelectItem: (endereco: string) => void;
  statusLabels?: Partial<Record<SeparacaoItemStatus, string>>;
}

export function SeparacaoItemList({
  itens,
  activeEndereco,
  onSelectItem,
  statusLabels,
}: SeparacaoItemListProps) {
  const labels = { ...DEFAULT_STATUS_LABELS, ...statusLabels };

  const pendentes = itens.filter((item) => isItemPendente(item.status));
  const parciais = itens.filter((item) => item.status === 'parcial');
  const separadosCompletos = itens.filter(
    (item) => item.status === 'separado' || item.status === 'esgotado'
  );
  const processados = itens.filter((item) => isItemProcessado(item.status));

  const progressPercent =
    itens.length > 0 ? Math.round((processados.length / itens.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <p className="text-body-sm text-on-surface-variant">
          {processados.length}/{itens.length} itens processados nesta ordem
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface-variant">
            <Circle className="h-3 w-3 text-outline" aria-hidden />
            {pendentes.length} a separar
          </span>
          {parciais.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-container px-3 py-1 text-label-sm text-on-warning-container">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              {parciais.length} parcial
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-label-sm text-secondary">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            {separadosCompletos.length} completos
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
            aria-label="Progresso da separação"
          />
        </div>
      </div>

      {pendentes.length > 0 && (
        <section>
          <h4 className="mb-2 text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
            A separar ({pendentes.length})
          </h4>
          <ul className="space-y-2" role="list" aria-label="Itens pendentes de separação">
            {pendentes.map((item) => (
              <SeparacaoItemRow
                key={item.id}
                item={item}
                isActive={activeEndereco?.trim() === item.endereco}
                statusLabel={labels[item.status]}
                onSelect={() => onSelectItem(item.endereco)}
              />
            ))}
          </ul>
        </section>
      )}

      {parciais.length > 0 && (
        <section>
          <h4 className="mb-2 flex items-center gap-1.5 text-label-md font-semibold uppercase tracking-wider text-warning">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Separação parcial ({parciais.length})
          </h4>
          <ul className="space-y-2" role="list" aria-label="Itens com separação parcial">
            {parciais.map((item) => (
              <SeparacaoItemRow
                key={item.id}
                item={item}
                isActive={activeEndereco?.trim() === item.endereco}
                statusLabel={labels[item.status]}
                onSelect={() => onSelectItem(item.endereco)}
              />
            ))}
          </ul>
        </section>
      )}

      {separadosCompletos.length > 0 && (
        <section>
          <h4 className="mb-2 text-label-md font-semibold uppercase tracking-wider text-secondary">
            Separados ({separadosCompletos.length})
          </h4>
          <ul className="space-y-2" role="list" aria-label="Itens separados por completo">
            {separadosCompletos.map((item) => (
              <SeparacaoItemRow
                key={item.id}
                item={item}
                isActive={activeEndereco?.trim() === item.endereco}
                statusLabel={labels[item.status]}
                onSelect={() => onSelectItem(item.endereco)}
              />
            ))}
          </ul>
        </section>
      )}

      {pendentes.length === 0 && processados.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-6 py-12 text-center">
          <Package className="h-10 w-10 text-outline" aria-hidden />
          <p className="text-body-sm text-on-surface-variant">
            Nenhum item nesta ordem.
          </p>
        </div>
      )}
    </div>
  );
}
