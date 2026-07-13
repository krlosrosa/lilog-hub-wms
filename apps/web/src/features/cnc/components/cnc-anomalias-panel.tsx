'use client';

import { useMemo, useState } from 'react';

import { cn } from '@lilog/ui';
import { AlertTriangle, PackageSearch } from 'lucide-react';

import {
  compactTableBodyClassName,
  compactTableHeadRowClassName,
  conferenciaTableClassName,
  conferenciaTableEmptyCellClassName,
  conferenciaTableHeadCellClassName,
} from '@/components/ui/compact-table-classes';
import { CncAnomaliaRow } from '@/features/cnc/components/cnc-anomalia-row';
import type { CncDetalhe, CncItemTipo } from '@/features/cnc/types/cnc.schema';
import { CNC_ITEM_TIPO_LABELS } from '@/features/cnc/types/cnc.schema';
import type { FotoEvidencia } from '@/features/recebimento/types/recebimento-detalhe.schema';

type FiltroAnomalia = 'todos' | CncItemTipo;

type CncAnomaliasPanelProps = {
  cnc: CncDetalhe;
  embedded?: boolean;
  fotosPorReferencia?: Map<string, FotoEvidencia[]>;
  podeGerenciar?: boolean;
  onItemSalvo?: () => void | Promise<void>;
};

const TABLE_HEADERS_BASE = [
  { label: '', className: 'w-7' },
  { label: '#', className: 'w-8 text-center' },
  { label: 'Produto', className: 'min-w-[140px] max-w-[220px]' },
  { label: 'Ocorrência', className: 'w-24 hidden sm:table-cell' },
  { label: 'Esp.', className: 'w-14 text-right' },
  { label: 'Rec.', className: 'w-14 text-right' },
  { label: 'Δ', className: 'w-14 text-right' },
  { label: 'Resp.', className: 'w-20 hidden md:table-cell' },
  { label: '', className: 'w-16 text-center' },
] as const;

const FILTROS: { id: FiltroAnomalia; label: string }[] = [
  { id: 'todos', label: 'Todas' },
  { id: 'divergencia', label: CNC_ITEM_TIPO_LABELS.divergencia },
  { id: 'avaria', label: CNC_ITEM_TIPO_LABELS.avaria },
];

export function CncAnomaliasPanel({
  cnc,
  embedded = false,
  fotosPorReferencia,
  podeGerenciar = false,
  onItemSalvo,
}: CncAnomaliasPanelProps) {
  const [filtro, setFiltro] = useState<FiltroAnomalia>('todos');

  const tableHeaders = [
    ...TABLE_HEADERS_BASE,
    ...(podeGerenciar
      ? [{ label: '', className: 'w-14 text-center' }]
      : []),
  ];

  const itensFiltrados = useMemo(() => {
    if (filtro === 'todos') {
      return cnc.itens;
    }

    return cnc.itens.filter((item) => item.tipo === filtro);
  }, [cnc.itens, filtro]);

  if (cnc.itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-outline-variant bg-surface-low/30 px-4 py-12 text-center">
        <PackageSearch
          className="size-8 text-muted-foreground/50"
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium text-foreground">
            Nenhuma anomalia vinculada
          </p>
          <p className="mt-0.5 max-w-sm text-xs text-muted-foreground">
            Esta CNC não possui itens de divergência ou avaria para analisar.
          </p>
        </div>
      </div>
    );
  }

  const divergencias = cnc.itens.filter((item) => item.tipo === 'divergencia').length;
  const avarias = cnc.itens.filter((item) => item.tipo === 'avaria').length;

  const filtros = (
    <div
      className="inline-flex shrink-0 rounded-md border border-outline-variant bg-surface p-0.5"
      role="group"
      aria-label="Filtrar anomalias"
    >
      {FILTROS.map((option) => {
        const count =
          option.id === 'todos'
            ? cnc.itens.length
            : cnc.itens.filter((item) => item.tipo === option.id).length;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setFiltro(option.id)}
            className={cn(
              'rounded px-2 py-0.5 text-[10px] font-semibold transition-colors',
              filtro === option.id
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
            <span className="ml-1 opacity-70">({count})</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <section
      className={cn(
        'overflow-hidden',
        embedded
          ? 'rounded-lg border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass'
          : 'rounded-xl border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass',
      )}
      aria-labelledby={embedded ? undefined : 'titulo-anomalias-cnc'}
    >
      {embedded ? (
        <div className="flex items-center justify-between gap-2 border-b border-outline-variant/50 bg-muted/15 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">
            {cnc.itens.length} item{cnc.itens.length !== 1 ? 's' : ''} ·{' '}
            {divergencias} div. · {avarias} avar.
          </p>
          {filtros}
        </div>
      ) : (
        <div className="flex flex-col gap-2 border-b border-outline-variant bg-muted/15 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2
              id="titulo-anomalias-cnc"
              className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
            >
              <AlertTriangle className="size-3.5 text-primary" aria-hidden />
              Anomalias para análise
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {cnc.itens.length} item{cnc.itens.length !== 1 ? 's' : ''} ·{' '}
              {divergencias} div. · {avarias} avar.
            </p>
          </div>
          {filtros}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className={conferenciaTableClassName}>
          <thead>
            <tr className={compactTableHeadRowClassName}>
              {tableHeaders.map((header, index) => (
                <th
                  key={header.label || `col-${index}`}
                  scope="col"
                  className={conferenciaTableHeadCellClassName(header.className)}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={compactTableBodyClassName}>
            {itensFiltrados.length === 0 ? (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  className={conferenciaTableEmptyCellClassName}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                    Nenhuma anomalia corresponde ao filtro selecionado.
                  </span>
                </td>
              </tr>
            ) : (
              itensFiltrados.map((item, index) => (
                <CncAnomaliaRow
                  key={item.id}
                  item={item}
                  index={index}
                  colSpan={tableHeaders.length}
                  defaultExpanded={index === 0 && cnc.situacao === 'em_analise'}
                  fotos={fotosPorReferencia?.get(item.referenciaId) ?? []}
                  podeGerenciar={podeGerenciar}
                  cncId={cnc.id}
                  eventos={cnc.eventos}
                  onSalvo={onItemSalvo}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
