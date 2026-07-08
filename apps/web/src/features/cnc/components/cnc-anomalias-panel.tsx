'use client';

import { useMemo, useState } from 'react';

import { cn } from '@lilog/ui';
import { AlertTriangle, PackageSearch } from 'lucide-react';

import { CncAnomaliaRow } from '@/features/cnc/components/cnc-anomalia-row';
import type { CncDetalhe, CncItemTipo } from '@/features/cnc/types/cnc.schema';
import { CNC_ITEM_TIPO_LABELS } from '@/features/cnc/types/cnc.schema';
import type { FotoEvidencia } from '@/features/recebimento/types/recebimento-detalhe.schema';

type FiltroAnomalia = 'todos' | CncItemTipo;

type CncAnomaliasPanelProps = {
  cnc: CncDetalhe;
  fotosPorReferencia?: Map<string, FotoEvidencia[]>;
};

const FILTROS: { id: FiltroAnomalia; label: string }[] = [
  { id: 'todos', label: 'Todas' },
  { id: 'divergencia', label: CNC_ITEM_TIPO_LABELS.divergencia },
  { id: 'avaria', label: CNC_ITEM_TIPO_LABELS.avaria },
];

const TABLE_HEADERS = [
  { label: '#', className: 'w-10 text-center' },
  { label: 'Tipo', className: 'w-24' },
  { label: 'Subtipo', className: 'w-28 hidden sm:table-cell' },
  { label: 'Produto', className: 'min-w-[160px]' },
  { label: 'Esperado', className: 'w-24 text-right' },
  { label: 'Recebido', className: 'w-24 text-right' },
  { label: 'Divergência', className: 'w-24 text-right' },
  { label: 'Responsável', className: 'w-28 hidden md:table-cell' },
  { label: 'Fotos', className: 'w-16 text-center hidden lg:table-cell' },
  { label: '', className: 'w-10' },
] as const;

export function CncAnomaliasPanel({
  cnc,
  fotosPorReferencia,
}: CncAnomaliasPanelProps) {
  const [filtro, setFiltro] = useState<FiltroAnomalia>('todos');

  const itensFiltrados = useMemo(() => {
    if (filtro === 'todos') {
      return cnc.itens;
    }

    return cnc.itens.filter((item) => item.tipo === filtro);
  }, [cnc.itens, filtro]);

  if (cnc.itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-outline-variant bg-surface-low/30 px-6 py-16 text-center">
        <PackageSearch
          className="size-10 text-muted-foreground/50"
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium text-foreground">
            Nenhuma anomalia vinculada
          </p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Esta CNC não possui itens de divergência ou avaria para analisar.
          </p>
        </div>
      </div>
    );
  }

  const divergencias = cnc.itens.filter((item) => item.tipo === 'divergencia').length;
  const avarias = cnc.itens.filter((item) => item.tipo === 'avaria').length;

  return (
    <section
      className="overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass"
      aria-labelledby="titulo-anomalias-cnc"
    >
      <div className="flex flex-col gap-3 border-b border-outline-variant bg-surface-low/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2
            id="titulo-anomalias-cnc"
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
          >
            <AlertTriangle className="size-4 text-primary" aria-hidden />
            Anomalias para análise
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {cnc.itens.length} item{cnc.itens.length !== 1 ? 's' : ''} ·{' '}
            {divergencias} divergência{divergencias !== 1 ? 's' : ''} · {avarias}{' '}
            avaria{avarias !== 1 ? 's' : ''}
          </p>
        </div>

        <div
          className="inline-flex shrink-0 rounded-lg border border-outline-variant bg-surface p-0.5"
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
                  'rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors',
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
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="sticky top-0 bg-surface-highest/60 backdrop-blur-md">
              {TABLE_HEADERS.map((header, index) => (
                <th
                  key={header.label || `col-${index}`}
                  scope="col"
                  className={cn(
                    'border-b border-outline-variant px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
                    header.className,
                  )}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {itensFiltrados.length === 0 ? (
              <tr>
                <td
                  colSpan={TABLE_HEADERS.length}
                  className="px-4 py-10 text-center text-xs text-muted-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <AlertTriangle className="size-4 shrink-0" aria-hidden />
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
                  colSpan={TABLE_HEADERS.length}
                  defaultExpanded={index === 0 && cnc.situacao === 'em_analise'}
                  fotos={fotosPorReferencia?.get(item.referenciaId) ?? []}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
