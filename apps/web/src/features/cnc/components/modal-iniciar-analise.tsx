'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@lilog/ui';
import { Loader2 } from 'lucide-react';

import type { CncDetalhe } from '@/features/cnc/types/cnc.schema';

type ModalIniciarAnaliseProps = {
  open: boolean;
  cnc: CncDetalhe;
  processando: boolean;
  onOpenChange: (aberto: boolean) => void;
  onConfirm: () => void;
};

export function ModalIniciarAnalise({
  open,
  cnc,
  processando,
  onOpenChange,
  onConfirm,
}: ModalIniciarAnaliseProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-outline-variant bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            Iniciar análise da CNC?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-muted-foreground">
              <p>
                A não conformidade{' '}
                <span className="font-semibold text-foreground">
                  {cnc.numero}
                </span>{' '}
                passará para o status <strong>Em Análise</strong> e você será
                registrado como analista responsável.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processando}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            disabled={processando}
            onClick={onConfirm}
            className="gap-2"
          >
            {processando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Iniciar análise
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
