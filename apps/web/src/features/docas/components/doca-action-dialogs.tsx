'use client';

import { useEffect, useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@lilog/ui';

import {
  fieldInputClassName,
  fieldLabelClassName,
} from '@/features/docas/components/form-field-classes';

export type DocaDialogState =
  | { type: 'block'; docaId: string; docaLabel: string }
  | { type: 'unblock'; docaId: string; docaLabel: string }
  | { type: 'maintenance'; docaId: string; docaLabel: string }
  | { type: 'delete'; docaId: string; docaLabel: string }
  | null;

type DocaActionDialogsProps = {
  dialogState: DocaDialogState;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirmBlock: (motivo?: string) => void;
  onConfirmUnblock: () => void;
  onConfirmMaintenance: (motivo?: string) => void;
  onConfirmDelete: () => void;
};

function MotivoTextarea({
  id,
  value,
  onChange,
  placeholder = 'Descreva o motivo (opcional)...',
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={fieldLabelClassName}>
        Motivo
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={cn(fieldInputClassName, 'mt-2 resize-none')}
      />
    </div>
  );
}

export function DocaActionDialogs({
  dialogState,
  isSubmitting,
  onClose,
  onConfirmBlock,
  onConfirmUnblock,
  onConfirmMaintenance,
  onConfirmDelete,
}: DocaActionDialogsProps) {
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (dialogState) {
      setMotivo('');
    }
  }, [dialogState]);

  const motivoTrimmed = motivo.trim();

  if (dialogState?.type === 'delete') {
    return (
      <AlertDialog
        open
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            onClose();
          }
        }}
      >
        <AlertDialogContent className="border-outline-variant bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Excluir doca?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta ação não pode ser desfeita. A doca{' '}
              <span className="font-semibold text-foreground">
                {dialogState.docaLabel}
              </span>{' '}
              será removida permanentemente se não houver histórico operacional.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={onConfirmDelete}
            >
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (!dialogState) {
    return null;
  }

  const open = true;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isSubmitting) {
      onClose();
    }
  };

  if (dialogState.type === 'block') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear doca</DialogTitle>
            <DialogDescription>
              Bloquear a doca{' '}
              <span className="font-semibold">{dialogState.docaLabel}</span>?
            </DialogDescription>
          </DialogHeader>
          <MotivoTextarea
            id="block-motivo"
            value={motivo}
            onChange={setMotivo}
            placeholder="Motivo do bloqueio (opcional)..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isSubmitting}
              onClick={() => onConfirmBlock(motivoTrimmed || undefined)}
            >
              Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (dialogState.type === 'unblock') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desbloquear doca</DialogTitle>
            <DialogDescription>
              Desbloquear a doca{' '}
              <span className="font-semibold">{dialogState.docaLabel}</span>?
              O status voltará para disponível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button disabled={isSubmitting} onClick={onConfirmUnblock}>
              Desbloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Colocar em manutenção</DialogTitle>
          <DialogDescription>
            A doca{' '}
            <span className="font-semibold">{dialogState.docaLabel}</span> ficará
            indisponível para operações até ser liberada.
          </DialogDescription>
        </DialogHeader>
        <MotivoTextarea
          id="maintenance-motivo"
          value={motivo}
          onChange={setMotivo}
          placeholder="Motivo da manutenção (opcional)..."
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={() => onConfirmMaintenance(motivoTrimmed || undefined)}
          >
            Confirmar manutenção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
