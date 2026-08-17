'use client';

import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { sectionCardClassName } from '@/components/ui/form-field-classes';
import { EtiquetaCompacta } from '@/features/peso-variavel/components/etiqueta-compact';
import type { EtiquetaSeparacao } from '@/features/peso-variavel/types/peso-variavel-etiquetas.schema';

export type EtiquetaSeparacaoPreviewProps = {
  etiqueta: EtiquetaSeparacao | null;
  previewIndex: number;
  previewTotal: number;
  isPrinting?: boolean;
  onAnterior: () => void;
  onProxima: () => void;
  onImprimir?: () => void;
  className?: string;
};

export function EtiquetaSeparacaoPreview({
  etiqueta,
  previewIndex,
  previewTotal,
  isPrinting,
  onAnterior,
  onProxima,
  onImprimir,
  className,
}: EtiquetaSeparacaoPreviewProps) {
  return (
    <section
      className={cn(sectionCardClassName, 'border-l-4 border-l-primary', className)}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Preview da Etiqueta</h3>
        <div className="flex items-center gap-2">
          {previewTotal > 0 ? (
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {previewIndex + 1}/{previewTotal}
            </span>
          ) : null}
          {onImprimir ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              disabled={previewTotal === 0 || isPrinting}
              onClick={() => void onImprimir()}
            >
              <Printer className="size-3.5" aria-hidden />
              Imprimir
            </Button>
          ) : null}
        </div>
      </div>

      {etiqueta ? (
        <EtiquetaCompacta etiqueta={etiqueta} />
      ) : (
        <div className="flex min-h-[120px] flex-col items-center justify-center rounded-md border border-dashed border-outline-variant bg-muted/30 px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Selecione linhas e gere etiquetas para visualizar o preview
          </p>
        </div>
      )}

      {previewTotal > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 px-2 text-xs"
            disabled={previewIndex <= 0}
            onClick={onAnterior}
          >
            <ChevronLeft className="size-3.5" aria-hidden />
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 px-2 text-xs"
            disabled={previewIndex >= previewTotal - 1}
            onClick={onProxima}
          >
            Próxima
            <ChevronRight className="size-3.5" aria-hidden />
          </Button>
        </div>
      ) : null}
    </section>
  );
}
