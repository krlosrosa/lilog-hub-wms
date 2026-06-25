'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';

import { OperadorProximaPausaResumo } from '@/features/gestao-recursos/components/operador-proxima-pausa-resumo';
import type { Operator } from '@/features/gestao-recursos/types/gestao-recursos.schema';

type FinalizarDemandaModalProps = {
  open: boolean;
  operator: Operator | null;
  mapaTitulo: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function FinalizarDemandaModal({
  open,
  operator,
  mapaTitulo,
  isSubmitting,
  onClose,
  onConfirm,
}: FinalizarDemandaModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && !isSubmitting && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" aria-hidden />
            Finalizar mapa
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-1 text-sm text-muted-foreground">
              <p>
                Confirmar finalização do mapa
                {mapaTitulo ? (
                  <>
                    {' '}
                    <strong className="text-foreground">&quot;{mapaTitulo}&quot;</strong>
                  </>
                ) : null}
                {operator ? (
                  <>
                    {' '}
                    de <strong className="text-foreground">{operator.name}</strong>
                  </>
                ) : null}
                ? A próxima demanda da fila será iniciada automaticamente.
              </p>

              {operator ? (
                <OperadorProximaPausaResumo
                  operator={operator}
                  variant="emphasis"
                />
              ) : null}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              'Confirmar finalização'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
