'use client';

import { Barcode, Copy, Download } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@lilog/ui';

export type EtiquetasZebraDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zplContent: string;
  totalEtiquetas: number;
  onCopiar: () => void;
  onBaixar: () => void;
};

export function EtiquetasZebraDialog({
  open,
  onOpenChange,
  zplContent,
  totalEtiquetas,
  onCopiar,
  onBaixar,
}: EtiquetasZebraDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl border-outline-variant bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Barcode className="size-5 text-primary" aria-hidden />
            Etiquetas Zebra (ZPL)
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {totalEtiquetas} etiqueta{totalEtiquetas !== 1 ? 's' : ''} no formato
            ZPL II para impressora térmica Zebra. Copie o código ou baixe o
            arquivo .zpl para enviar à impressora.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-foreground">
              Código ZPL gerado
            </span>
            <span className="rounded bg-surface-highest px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground">
              ZPL II · 100x150mm · 203dpi
            </span>
          </div>
          <pre
            className={cn(
              'max-h-[min(50vh,420px)] overflow-auto rounded-md border border-outline-variant',
              'bg-surface-lowest p-3 font-mono text-[11px] leading-relaxed text-foreground',
            )}
          >
            {zplContent || '—'}
          </pre>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={!zplContent}
            onClick={onCopiar}
          >
            <Copy className="size-4" aria-hidden />
            Copiar ZPL
          </Button>
          <Button
            type="button"
            className="gap-2"
            disabled={!zplContent}
            onClick={onBaixar}
          >
            <Download className="size-4" aria-hidden />
            Baixar .zpl
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
