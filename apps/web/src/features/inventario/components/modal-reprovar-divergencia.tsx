'use client';

import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  cn,
} from '@lilog/ui';
import { Loader2 } from 'lucide-react';

import type { DivergenciaItem } from '@/features/inventario/types/inventario-detalhe.schema';

type ModalReprovarDivergenciaProps = {
  open: boolean;
  divergencia: DivergenciaItem | null;
  processando: boolean;
  onOpenChange: (aberto: boolean) => void;
  onConfirm: (motivoReprovacao: string) => void;
};

const inputClass = cn(
  'w-full rounded-lg border border-input bg-surface-low px-3 py-2',
  'text-label-md placeholder:text-muted-foreground/50',
  'focus:outline-none focus:ring-2 focus:ring-ring',
);

export function ModalReprovarDivergencia({
  open,
  divergencia,
  processando,
  onOpenChange,
  onConfirm,
}: ModalReprovarDivergenciaProps) {
  const [motivo, setMotivo] = useState('');

  const handleOpenChange = (aberto: boolean) => {
    if (!aberto) {
      setMotivo('');
    }
    onOpenChange(aberto);
  };

  const handleConfirm = () => {
    if (!motivo.trim()) {
      return;
    }

    onConfirm(motivo.trim());
    setMotivo('');
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg border-outline-variant bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Reprovar divergência
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Informe o motivo da reprovação. O saldo não será ajustado para
                esta divergência.
              </p>
              {divergencia ? (
                <p className="rounded-md border border-outline-variant bg-muted/30 px-3 py-2 text-xs text-foreground">
                  <span className="font-semibold">{divergencia.sku}</span>
                  {' · '}
                  {divergencia.produtoNome}
                  {divergencia.endereco ? (
                    <>
                      {' · '}
                      {divergencia.endereco}
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <textarea
          className={cn(inputClass, 'min-h-24 resize-y')}
          placeholder="Descreva o motivo da reprovação"
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={processando}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={processando || !motivo.trim()}
            onClick={handleConfirm}
          >
            {processando ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Reprovando…
              </>
            ) : (
              'Reprovar'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
