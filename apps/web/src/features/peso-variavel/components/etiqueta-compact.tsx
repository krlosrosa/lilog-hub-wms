'use client';

import { cn } from '@lilog/ui';

import { QrCodePreview } from '@/features/peso-variavel/components/qr-code-preview';
import type { EtiquetaSeparacao } from '@/features/peso-variavel/types/peso-variavel-etiquetas.schema';

export type EtiquetaCompactaProps = {
  etiqueta: EtiquetaSeparacao;
  className?: string;
  variant?: 'screen' | 'print';
};

export function EtiquetaCompacta({
  etiqueta,
  className,
  variant = 'screen',
}: EtiquetaCompactaProps) {
  const caixaLabel = `${etiqueta.numeroCaixa}/${etiqueta.totalCaixas}`;
  const isPrint = variant === 'print';

  return (
    <div
      className={cn(
        isPrint
          ? 'break-inside-avoid rounded border border-black bg-white p-2 text-black'
          : 'rounded-md border border-outline-variant bg-background p-2 text-foreground shadow-inner',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-stretch gap-2',
          isPrint ? 'min-h-[68px]' : 'min-h-[72px]',
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 leading-tight">
          <p
            className={cn(
              'truncate text-[11px] font-bold',
              isPrint ? 'text-black' : 'text-foreground',
            )}
          >
            {etiqueta.remessa}
          </p>
          <p
            className={cn(
              'truncate text-[11px] font-semibold',
              isPrint ? 'text-black' : 'text-foreground',
            )}
          >
            {etiqueta.nomeCliente}
          </p>
          <p className="flex min-w-0 items-baseline gap-2">
            <span
              className={cn(
                'min-w-0 truncate font-mono text-[10px]',
                isPrint ? 'text-black/70' : 'text-muted-foreground',
              )}
            >
              {etiqueta.cliente}
            </span>
            <span
              className={cn(
                'shrink-0 tabular-nums text-[9px] font-normal',
                isPrint ? 'text-black/50' : 'text-muted-foreground/70',
              )}
            >
              {caixaLabel}
            </span>
          </p>
        </div>

        <QrCodePreview
          value={etiqueta.codigo}
          className={isPrint ? 'h-14 w-14 border-black' : 'w-[72px]'}
          qrSize={isPrint ? 52 : undefined}
          title={`QR code da etiqueta ${etiqueta.codigo}`}
        />
      </div>
    </div>
  );
}
