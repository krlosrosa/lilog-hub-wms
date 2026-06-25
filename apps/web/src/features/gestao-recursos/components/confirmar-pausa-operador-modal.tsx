'use client';

import { Coffee, Loader2, LogOut } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';

import type { Operator } from '@/features/gestao-recursos/types/gestao-recursos.schema';
import { TIPO_PAUSA_REGRA_LABELS } from '@/features/regras-pausas/types/tipo-pausa-regra-tabs';

export type PausaOperadorModalAction = 'iniciar-termica' | 'encerrar';

type ConfirmarPausaOperadorModalProps = {
  open: boolean;
  operator: Operator | null;
  action: PausaOperadorModalAction | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmarPausaOperadorModal({
  open,
  operator,
  action,
  isSubmitting,
  onClose,
  onConfirm,
}: ConfirmarPausaOperadorModalProps) {
  const isIniciar = action === 'iniciar-termica';

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !isSubmitting && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isIniciar ? (
              <Coffee className="size-5 text-amber-600 dark:text-amber-400" aria-hidden />
            ) : (
              <LogOut className="size-5 text-primary" aria-hidden />
            )}
            {isIniciar ? 'Registrar pausa térmica' : 'Encerrar pausa'}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 pt-1 text-sm text-muted-foreground">
              {operator ? (
                <>
                  <p>
                    {isIniciar ? (
                      <>
                        Confirmar registro de{' '}
                        <strong className="text-foreground">
                          {TIPO_PAUSA_REGRA_LABELS.termica}
                        </strong>{' '}
                        para <strong className="text-foreground">{operator.name}</strong>?
                      </>
                    ) : (
                      <>
                        Confirmar encerramento da pausa de{' '}
                        <strong className="text-foreground">{operator.name}</strong>?
                      </>
                    )}
                  </p>
                  {isIniciar && operator.tempoTrabalhoContinuoMinutos ? (
                    <p className="text-caption">
                      Tempo de trabalho contínuo: {operator.tempoTrabalhoContinuoMinutos} min
                      {operator.pausaAtrasoMinutos
                        ? ` (+${operator.pausaAtrasoMinutos} min acima do intervalo)`
                        : ''}
                    </p>
                  ) : null}
                  {!isIniciar && operator.pauseTipo ? (
                    <p className="text-caption">
                      Tipo atual: {TIPO_PAUSA_REGRA_LABELS[operator.pauseTipo]}
                      {operator.pauseDuration
                        ? ` · ${operator.pauseDuration.replace(' EM PAUSA', '')}`
                        : ''}
                    </p>
                  ) : null}
                </>
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
            variant={isIniciar ? 'default' : 'default'}
            className={
              isIniciar
                ? 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500'
                : undefined
            }
            disabled={isSubmitting || !operator}
            onClick={onConfirm}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : isIniciar ? (
              'Confirmar pausa térmica'
            ) : (
              'Confirmar encerramento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
