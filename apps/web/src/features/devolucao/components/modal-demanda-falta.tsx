'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';
import { AlertTriangle } from 'lucide-react';

type ModalDemandaFaltaProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  codigoDemanda: string;
  isLoading?: boolean;
};

export function ModalDemandaFalta({
  open,
  onClose,
  onConfirm,
  codigoDemanda,
  isLoading = false,
}: ModalDemandaFaltaProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="border-outline-variant bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="size-4 text-secondary" aria-hidden />
            Demanda de falta
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Registrar demanda de falta para{' '}
            <span className="font-medium text-foreground">{codigoDemanda}</span>.
            Não há item físico para receber — o processo será finalizado
            diretamente, sem passar pela conferência.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isLoading}
            className="gap-1.5"
          >
            Confirmar falta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
