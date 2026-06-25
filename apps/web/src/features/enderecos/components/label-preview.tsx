'use client';

import { Printer } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import type { LabelPreview } from '@/features/enderecos/types/enderecos-configuracao.schema';
import { sectionCardClassName } from '@/features/enderecos/components/form-field-classes';

export type LabelPreviewProps = {
  preview: LabelPreview;
  onPrint?: () => void;
  className?: string;
  variant?: 'config' | 'thermal';
};

function BarcodeMock() {
  const widths = [2, 4, 1, 6, 2, 3, 5, 2, 1, 4, 2, 2, 4, 1, 6, 2, 3, 5, 2, 1, 4, 2];

  return (
    <div className="mb-4 flex h-16 w-full gap-px bg-foreground p-1">
      {widths.map((w, i) => (
        <div
          key={i}
          className="h-full bg-background"
          style={{ width: `${w}px` }}
        />
      ))}
    </div>
  );
}

export function LabelPreviewCard({
  preview,
  onPrint,
  className,
  variant = 'config',
}: LabelPreviewProps) {
  if (variant === 'thermal') {
    return (
      <div
        className={cn(
          'relative flex aspect-[4/3] flex-col items-center justify-center rounded-lg bg-background p-8 text-foreground',
          className,
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(0deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '100% 2px',
          }}
          aria-hidden
        />
        <div className="text-4xl font-black tracking-tighter">
          {preview.enderecoCurto}
        </div>
        <BarcodeMock />
        <div className="text-center text-[10px] font-bold uppercase tracking-widest">
          {preview.unidade}
          <br />
          LOCALIZAÇÃO PICKING
        </div>
      </div>
    );
  }

  return (
    <section
      className={cn(
        sectionCardClassName,
        'border-l-4 border-l-primary',
        className,
      )}
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-headline-md font-semibold text-foreground">
          Preview da Etiqueta
        </h3>
        {onPrint && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onPrint}
            aria-label="Imprimir etiqueta"
          >
            <Printer className="size-4" />
          </Button>
        )}
      </div>
      <div className="flex flex-col items-center rounded-sm bg-background p-6 text-foreground shadow-inner">
        <div className="mb-4 flex w-full items-start justify-between text-[10px] font-bold uppercase tracking-tighter">
          <span>FranchiseOS WMS</span>
          <span>Unit: {preview.unidade}</span>
        </div>
        <div className="mb-2 text-[32px] font-black leading-none tracking-tight">
          {preview.enderecoCurto}
        </div>
        <BarcodeMock />
        <div className="font-mono text-xs font-bold">{preview.dimensoesLabel}</div>
      </div>
      <p className="mt-4 text-center text-[11px] italic text-muted-foreground">
        {preview.formato}
      </p>
    </section>
  );
}
