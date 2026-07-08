'use client';

import { useState } from 'react';

import { AlertTriangle, ClipboardCheck, Search } from 'lucide-react';

import { cn } from '@lilog/ui';

import { Pagination } from '@/features/filiais/components/pagination';
import { DetalheConferenciaRow } from '@/features/debito-transportadora/components/detalhe-conferencia-row';
import type { AtualizarItemProcessoDebitoBody } from '@/features/debito-transportadora/lib/cobranca-transportadora-api';
import {
  DEBITO_ITEM_STATUS_LABELS,
  type DebitoConferenciaItem,
  type DebitoItemStatus,
} from '@/features/debito-transportadora/types/debito.schema';

const HEADERS = [
  { label: '', className: 'w-10' },
  { label: 'NF', className: 'w-24' },
  { label: 'Produto', className: 'min-w-[160px]' },
  { label: 'Qtd.', className: 'w-24 text-center' },
  { label: 'Status', className: 'w-32' },
  { label: 'Peso Total', className: 'w-24 text-right' },
  { label: 'Valor', className: 'w-28 text-right' },
  { label: 'Obs.', className: 'min-w-[140px]' },
  { label: '', className: 'w-10' },
] as const;

type DetalheConferenciaTableProps = {
  itensPagina: readonly DebitoConferenciaItem[];
  totalAnomalias: number;
  busca: string;
  onChangeBusca: (value: string) => void;
  pagina: number;
  totalPaginas: number;
  onChangePagina: (pagina: number) => void;
  totalFiltrados: number;
  itemsInicio: number;
  pageSize: number;
  selectedIds: ReadonlySet<string>;
  disabled?: boolean;
  onToggleSelect: (itemId: string) => void;
  onToggleSelectAll: (itemIds: readonly string[]) => void;
  onUpdateItem: (
    itemId: string,
    body: AtualizarItemProcessoDebitoBody,
  ) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onBulkStatus: (status: DebitoItemStatus) => Promise<void>;
};

export function DetalheConferenciaTable({
  itensPagina,
  totalAnomalias,
  busca,
  onChangeBusca,
  pagina,
  totalPaginas,
  onChangePagina,
  totalFiltrados,
  itemsInicio,
  pageSize,
  selectedIds,
  disabled = false,
  onToggleSelect,
  onToggleSelectAll,
  onUpdateItem,
  onRemoveItem,
  onBulkStatus,
}: DetalheConferenciaTableProps) {
  const [bulkStatus, setBulkStatus] = useState<DebitoItemStatus>('cobrar');
  const idsPagina = itensPagina.map((item) => item.id);
  const allPageSelected =
    idsPagina.length > 0 && idsPagina.every((id) => selectedIds.has(id));

  return (
    <section
      className="overflow-hidden rounded-lg border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass"
      aria-labelledby="titulo-conferencia-debito"
    >
      <div className="flex flex-col gap-2 border-b border-outline-variant bg-surface-low px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <h2
            id="titulo-conferencia-debito"
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
          >
            <ClipboardCheck className="size-3.5 text-primary" aria-hidden />
            Itens Conferidos
          </h2>
          <div className="relative min-w-[12rem] flex-1 max-w-xs">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={busca}
              onChange={(event) => onChangeBusca(event.target.value)}
              placeholder="Filtrar SKU, produto ou NF..."
              aria-label="Filtrar itens conferidos"
              className={cn(
                'h-7 w-full rounded-md border border-input bg-surface py-1 pl-7 pr-2',
                'text-[11px] placeholder:text-muted-foreground/50',
                'focus:outline-none focus:ring-2 focus:ring-ring',
              )}
            />
          </div>
        </div>
        {totalAnomalias > 0 ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-destructive/40 bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive">
            <AlertTriangle className="size-3 shrink-0" aria-hidden />
            {totalAnomalias} anomalias
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-status-active/30 bg-status-active/10 px-2 py-0.5 text-[10px] font-semibold text-status-active">
            Sem anomalias
          </span>
        )}
      </div>

      {selectedIds.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant bg-primary/5 px-3 py-2">
          <span className="text-[11px] font-semibold text-foreground">
            {selectedIds.size} selecionado{selectedIds.size === 1 ? '' : 's'}
          </span>
          <select
            value={bulkStatus}
            disabled={disabled}
            onChange={(event) =>
              setBulkStatus(event.target.value as DebitoItemStatus)
            }
            aria-label="Status em massa"
            className="h-8 rounded-md border border-input bg-surface px-2 text-[11px] font-semibold"
          >
            {(Object.keys(DEBITO_ITEM_STATUS_LABELS) as DebitoItemStatus[]).map(
              (status) => (
                <option key={status} value={status}>
                  {DEBITO_ITEM_STATUS_LABELS[status]}
                </option>
              ),
            )}
          </select>
          <button
            type="button"
            disabled={disabled}
            onClick={() => void onBulkStatus(bulkStatus)}
            className={cn(
              'h-8 rounded-md bg-primary px-3 text-[11px] font-semibold text-primary-foreground',
              'transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            Aplicar status
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="sticky top-0 bg-surface-highest/50 backdrop-blur-md">
              <th scope="col" className="border-b border-outline-variant px-2 py-1.5">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  disabled={disabled || idsPagina.length === 0}
                  onChange={() => onToggleSelectAll(idsPagina)}
                  aria-label="Selecionar todos os itens da página"
                  className="size-3.5 rounded border-input accent-primary"
                />
              </th>
              {HEADERS.slice(1).map((header) => (
                <th
                  key={header.label || 'actions'}
                  scope="col"
                  className={cn(
                    'border-b border-outline-variant px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
                    header.className,
                  )}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {itensPagina.length ? (
              itensPagina.map((item) => (
                <DetalheConferenciaRow
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  disabled={disabled}
                  onToggleSelect={onToggleSelect}
                  onUpdateItem={onUpdateItem}
                  onRemoveItem={onRemoveItem}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={HEADERS.length}
                  className="px-2 py-12 text-center text-xs text-muted-foreground"
                >
                  {busca.trim()
                    ? 'Nenhum item encontrado para o filtro aplicado.'
                    : 'Nenhum item conferido registrado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        pagina={pagina}
        totalPaginas={totalPaginas}
        onChangePagina={onChangePagina}
        totalFiltrados={totalFiltrados}
        itemsInicio={itemsInicio}
        pageSize={pageSize}
        resourceLabelPlural="itens conferidos"
      />
    </section>
  );
}
