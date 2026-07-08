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

import type { CncDetalhe } from '@/features/cnc/types/cnc.schema';

type ModalCancelarCncProps = {
  open: boolean;
  cnc: CncDetalhe;
  processando: boolean;
  onOpenChange: (aberto: boolean) => void;
  onConfirm: (observacao: string) => void;
};

const inputClass = cn(
  'w-full rounded-lg border border-input bg-surface-low px-3 py-2',
  'text-label-md placeholder:text-muted-foreground/50',
  'focus:outline-none focus:ring-2 focus:ring-ring',
);

export function ModalCancelarCnc({
  open,
  cnc,
  processando,
  onOpenChange,
  onConfirm,
}: ModalCancelarCncProps) {
  const [observacao, setObservacao] = useState('');

  const handleConfirm = () => {
    if (!observacao.trim()) {
      return;
    }

    onConfirm(observacao.trim());
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg border-outline-variant bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Cancelar não conformidade
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <p className="text-muted-foreground">
              A CNC{' '}
              <span className="font-semibold text-foreground">{cnc.numero}</span>{' '}
              será cancelada. Informe o motivo do cancelamento.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2">
          <label
            htmlFor="cancelar-observacao"
            className="mb-1 block text-label-md text-muted-foreground"
          >
            Observação <span className="text-destructive">*</span>
          </label>
          <textarea
            id="cancelar-observacao"
            value={observacao}
            onChange={(event) => setObservacao(event.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Descreva o motivo do cancelamento..."
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={processando}>Voltar</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={processando || !observacao.trim()}
            onClick={handleConfirm}
            className="gap-2"
          >
            {processando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Confirmar cancelamento
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
