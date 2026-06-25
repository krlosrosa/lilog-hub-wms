'use client';

import { useMemo, useState } from 'react';

import { cn } from '@lilog/ui';
import { ChevronRight } from 'lucide-react';

import type { GrupoMapaApi } from '@/features/transporte/lib/gerar-mapas-api';

type ConferenciaPreviewTableProps = {
  grupos: GrupoMapaApi[];
};

function formatarPeso(peso: number): string {
  return `${peso.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`;
}

function GrupoConferenciaTable({
  grupo,
  index,
}: {
  grupo: GrupoMapaApi;
  index: number;
}) {
  const [expandido, setExpandido] = useState(index === 0);
  const cab = grupo.cabecalho;

  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-low/30">
      <button
        type="button"
        onClick={() => setExpandido((prev) => !prev)}
        className="flex w-full items-center gap-2 border-b border-outline-variant/60 bg-surface-low/50 px-3 py-2 text-left transition-colors hover:bg-surface-low"
        aria-expanded={expandido}
      >
        <ChevronRight
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform',
            expandido && 'rotate-90',
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">
            {grupo.titulo}
          </p>
          {grupo.subtitulo && (
            <p className="truncate text-[10px] text-muted-foreground">
              {grupo.subtitulo}
            </p>
          )}
          {cab && (
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              {cab.transporte}
              {cab.primeiroCliente ? ` · ${cab.primeiroCliente}` : ''}
              {cab.empresa ? ` · ${cab.empresa}` : ''}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
          <span>{grupo.totalItens} itens</span>
          {cab && (
            <>
              <span>·</span>
              <span>{cab.totalCaixas} cx</span>
              <span>·</span>
              <span>{cab.totalUnidades} un</span>
            </>
          )}
          <span>·</span>
          <span>{formatarPeso(grupo.pesoTotal)}</span>
        </div>
      </button>

      {expandido && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-low/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">Descrição</th>
                <th className="px-3 py-2 font-medium">Lote</th>
                <th className="px-3 py-2 text-right font-medium">Cx</th>
                <th className="px-3 py-2 text-right font-medium">Un</th>
                <th className="px-3 py-2 text-right font-medium">Peso</th>
              </tr>
            </thead>
            <tbody>
              {grupo.itens.map((item) => (
                <tr
                  key={`${item.sku}-${item.lote ?? ''}-${item.remessa}`}
                  className="border-b border-outline-variant/40 last:border-0"
                >
                  <td className="px-3 py-1.5 font-mono text-[11px]">{item.sku}</td>
                  <td className="max-w-[200px] truncate px-3 py-1.5 text-foreground">
                    {item.descricao ?? '—'}
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {item.lote ?? '—'}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {item.breakdown?.caixas ?? 0}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {item.breakdown?.unidades ?? 0}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                    {item.peso != null ? formatarPeso(item.peso) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ConferenciaPreviewTable({ grupos }: ConferenciaPreviewTableProps) {
  if (grupos.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-xs text-muted-foreground">
        Nenhum grupo de conferência gerado para a configuração atual.
      </p>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {grupos.map((grupo, index) => (
        <GrupoConferenciaTable key={grupo.id} grupo={grupo} index={index} />
      ))}
    </div>
  );
}
