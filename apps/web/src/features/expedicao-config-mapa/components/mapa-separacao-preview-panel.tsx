'use client';

import { cn } from '@lilog/ui';
import { Eye, FileText } from 'lucide-react';

import { MapaSeparacaoQr } from '@/features/transporte/components/mapa-separacao-qr';
import {
  panelBodyClassName,
  panelClassName,
  panelHeaderClassName,
  sectionLabelClassName,
} from '@/features/expedicao-config-mapa/components/panel-styles';
import type { MapaSeparacaoPreview } from '@/features/expedicao-config-mapa/types/config-mapa.schema';

type MapaSeparacaoPreviewPanelProps = {
  mapas: MapaSeparacaoPreview[];
};

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-outline-variant bg-surface-low/50 px-2 py-0.5 text-[10px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </span>
  );
}

export function MapaSeparacaoPreviewPanel({ mapas }: MapaSeparacaoPreviewPanelProps) {
  const mapa = mapas[0];

  if (!mapa) return null;

  const restantes = mapa.totalLinhas - mapa.linhas.length;

  return (
    <section className={cn(panelClassName, 'sticky top-4 flex flex-col')}>
      <div className={panelHeaderClassName}>
        <div className="flex items-center gap-2">
          <Eye className="size-3.5 text-primary" aria-hidden />
          <h2 className="text-xs font-semibold text-foreground">Preview do mapa</h2>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {mapas.length} mapa{mapas.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className={cn(panelBodyClassName, 'min-h-[420px] space-y-3')}>
        <div className="rounded-lg border border-outline-variant bg-background p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="size-3.5 text-muted-foreground" aria-hidden />
                <p className="font-mono text-lg font-bold tracking-tight text-foreground">
                  {mapa.codigo}
                </p>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{mapa.titulo}</h3>
              <p className="text-[11px] text-muted-foreground">{mapa.subtitulo}</p>
            </div>
            <MapaSeparacaoQr value={mapa.codigo} size={72} />
          </div>

          <div className="mb-3 flex flex-wrap gap-1">
            {mapa.transporte && (
              <MetaBadge label="Transp." value={mapa.transporte} />
            )}
            <MetaBadge label="Grupo" value={mapa.agrupamento} />
            <MetaBadge label="Palete" value={mapa.paletizacao} />
            <MetaBadge label="Impressão" value={mapa.tipoImpressao} />
            <MetaBadge label="Conferência" value={mapa.conferencia} />
          </div>

          <div className="overflow-x-auto rounded-md border border-outline-variant">
            <table className="w-full min-w-[480px] border-collapse text-[11px]">
              <thead>
                <tr className="bg-muted/40">
                  {['Seq', 'Endereço', 'SKU', 'Produto', 'Qtd', '✓'].map((col) => (
                    <th
                      key={col}
                      className={cn(
                        'border-b border-outline-variant px-2 py-1.5 text-left font-semibold text-muted-foreground',
                        col === 'Qtd' && 'text-right',
                        col === '✓' && 'w-8 text-center',
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mapa.linhas.map((linha) => (
                  <tr
                    key={`${mapa.id}-${linha.sequencia}`}
                    className="hover:bg-muted/20"
                  >
                    <td className="border-b border-outline-variant/50 px-2 py-1.5">
                      {linha.sequencia}
                    </td>
                    <td className="border-b border-outline-variant/50 px-2 py-1.5 font-mono font-semibold">
                      {linha.endereco}
                    </td>
                    <td className="border-b border-outline-variant/50 px-2 py-1.5 font-mono">
                      {linha.sku}
                    </td>
                    <td className="border-b border-outline-variant/50 px-2 py-1.5">
                      {linha.produto}
                    </td>
                    <td className="border-b border-outline-variant/50 px-2 py-1.5 text-right font-semibold">
                      {linha.quantidade}
                    </td>
                    <td className="border-b border-outline-variant/50 px-2 py-1.5 text-center">
                      <span className="inline-block size-3.5 border border-outline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {restantes > 0 && (
            <p className="mt-2 text-[10px] italic text-muted-foreground">
              + {restantes} linha(s) no mapa final
            </p>
          )}

          <p className="mt-3 border-t border-outline-variant pt-2 text-[10px] text-muted-foreground">
            Operador: _______________ · Data: ___/___/______
          </p>
        </div>

        {mapas.length > 1 && (
          <p className={cn(sectionLabelClassName, 'text-center normal-case')}>
            + {mapas.length - 1} mapa(s) adicional(is) na geração
          </p>
        )}
      </div>
    </section>
  );
}
